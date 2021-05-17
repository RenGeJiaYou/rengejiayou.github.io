"use strict";

var RESULT_UNKNOWN = 0;   //状态:对弈中
var RESULT_WIN = 1;       //状态:玩家赢
var RESULT_DRAW = 2;      //状态:和局
var RESULT_LOSS = 3;      //状态:玩家赢

var windowWidth = window.screen.width;    //分辨率适配:当前设备的宽
var standardWidth=610;
var sacle =(windowWidth/standardWidth).toFixed(1);           //控制棋盘比例,保留一位小数点

var BOARD_WIDTH = 521;    //棋盘.jpg的宽
var BOARD_HEIGHT = 577;   //棋盘.jpg的长
var SQUARE_SIZE = 57;     //棋子.jpg的边长,覆盖在交叉点上
var SQUARE_LEFT = (BOARD_WIDTH*sacle - SQUARE_SIZE*sacle * 9) >> 1;   //整个棋子区域离棋盘.jpg边缘的左边距
var SQUARE_TOP = (BOARD_HEIGHT*sacle - SQUARE_SIZE*sacle * 10) >> 1;  //整个棋子区域离棋盘.jpg边缘的上边距
var THINKING_SIZE = 32*sacle;   //thinking.jpg的边长
var THINKING_LEFT = (BOARD_WIDTH*sacle - THINKING_SIZE*sacle) >> 1;   //thinking.jpg离棋盘.jpg的左边距
var THINKING_TOP = (BOARD_HEIGHT*sacle - THINKING_SIZE*sacle) >> 1;   //thinking.jpg离棋盘.jpg的上边距 
var MAX_STEP = 8;
var PIECE_NAME = [    //由drawSquare()调用
  "oo", null, null, null, null, null, null, null,
  "rk", "ra", "rb", "rn", "rr", "rc", "rp", null,
  "bk", "ba", "bb", "bn", "br", "bc", "bp", null,
];

//输入当前棋子的一维矩阵下标,得到应当显示的x坐标
function SQ_X(sq) {
  return (SQUARE_LEFT + (FILE_X(sq) - 3) * SQUARE_SIZE*sacle);
}

//输入当前棋子的一维矩阵下标,得到应当显示的y坐标
function SQ_Y(sq) {
  return (SQUARE_TOP + (RANK_Y(sq) - 3) * SQUARE_SIZE *sacle);
}

function MOVE_PX(src, dst, step) {
  return Math.floor((src * step + dst * (MAX_STEP - step)) / MAX_STEP + .5)*sacle + "px";
}

//分出结果后0.25s 给出警告
function alertDelay(message) {
  setTimeout(function() {
    alert(message);
  }, 250);
}



function Board(container, images, sounds) {
  this.images = images;
  this.sounds = sounds;        //音效文件夹
  this.pos = new Position();
  this.pos.fromFen("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1");
  this.animated = true;       //标识是否拥有动画,默认是
  this.sound = true;          //标识是否播放音效,默认是
  this.search = null;
  this.imgSquares = [];       //图片数组,由
  this.sqSelected = 0;	//当前被选中棋子的位置
  this.mvLast = 0;      //来自 mvlist表的最后一个 / 最近的一步走法
  this.millis = 0;
  this.computer = -1;   //标明电脑是执黑(0)还是执红(1)还是不用电脑(-1)
  this.result = RESULT_UNKNOWN;
  this.busy = false;    //busy默认为false，此时可以响应用户的点击事件。如果电脑正常思考状态下，比如正常执行搜索算法，busy会被置为true，不响应点击事件。

  var style = container.style;
  style.position = "relative";
  style.width = BOARD_WIDTH*sacle + "px";       //通过这种方式,将代码中的数字变成了页面上的内容
  style.height = BOARD_HEIGHT*sacle + "px";
  style.background = "url(" + images + "board.jpg) no-repeat";
  style.backgroundSize = "100%";    //!!!!!修改背景图片要用属性backgroundSize
  
  var this_ = this;
  for (var sq = 0; sq < 256; sq ++) {   //棋盘外的无用数组,img数组要表示为 null
    if (!IN_BOARD(sq)) {
      this.imgSquares.push(null);
      continue;
    }
    var img = document.createElement("img");
    var style = img.style;
    style.position = "absolute";
    style.left = SQ_X(sq);
    style.top = SQ_Y(sq);
    style.width = SQUARE_SIZE*sacle;
    style.height = SQUARE_SIZE*sacle;
    style.zIndex = 0;
    img.onmousedown = function(sq_) {//每个棋盘区域都会绑定点击事件，参数sq_表示了具体点击的区域。
      return function() {
        this_.clickSquare(sq_);
      }
    } (sq);
    container.appendChild(img);     //定义好<img>后,追加到html
    this.imgSquares.push(img);      //将img标签存储到imgSquares数组中，方便后续对该区域进行操作（比如，显示不同的棋子图片）
  }

  this.thinking = document.createElement("img");
  this.thinking.src = images + "thinking.gif";
  style = this.thinking.style;
  style.visibility = "hidden";
  style.position = "absolute";
  style.left = THINKING_LEFT*sacle + "px";
  style.top = THINKING_TOP*sacle + "px";
  container.appendChild(this.thinking);   //在<div id="container"></div> 内再添加一个子元素,呈现<thinking.gif>

  this.dummy = document.createElement("div");
  this.dummy.style.position = "absolute";   //采用绝对定位
  container.appendChild(this.dummy);

  //显示棋子图片
  this.flushBoard();
}

//播放音效
Board.prototype.playSound = function(soundFile) {
  if (!this.sound) {
    return;
  }
  try {
    new Audio(this.sounds + soundFile + ".wav").play();     
  } catch (e) {
    this.dummy.innerHTML= "<embed src=\"" + this.sounds + soundFile +
        ".wav\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
  }
}

Board.prototype.setSearch = function(hashLevel) {
  this.search = hashLevel == 0 ? null : new Search(this.pos, hashLevel);
}

//computer=0,返回电脑对应的一维数组序号
//computer=1,返回玩家本来的一维数组序号
Board.prototype.flipped = function(sq) {
  return this.computer == 0 ? SQUARE_FLIP(sq) : sq;
}

//确认是否电脑走棋:是->true;否->false
Board.prototype.computerMove = function() {
  return this.pos.sdPlayer == this.computer;
}

Board.prototype.computerLastMove = function() {
  return 1 - this.pos.sdPlayer == this.computer;
}

//判断一步棋是否合法，如果合法，就执行这步棋。
Board.prototype.addMove = function(mv, computerMove) {
  if (!this.pos.legalMove(mv)) {
    return;
  }
  if (!this.pos.makeMove(mv)) {
    this.playSound("illegal");
    return;
  }
  this.busy = true;
  if (!this.animated) {
    this.postAddMove(mv, computerMove);
    return;
  }

  var sqSrc = this.flipped(SRC(mv));	//返回当前下棋方的走法的起点
  var xSrc = SQ_X(sqSrc);				//分解出起点的x坐标
  var ySrc = SQ_Y(sqSrc);				//分解出起点的y坐标
  var sqDst = this.flipped(DST(mv));	//返回当前下棋方的走法的终点
  var xDst = SQ_X(sqDst);				//分解出终点的x坐标
  var yDst = SQ_Y(sqDst);				//分解出终点的y坐标
  var style = this.imgSquares[sqSrc].style;
  style.zIndex = 256;
  var step = MAX_STEP - 1;
  var this_ = this;
  var timer = setInterval(function() {
    if (step == 0) {
      clearInterval(timer);
      style.left = xSrc + "px";
      style.top = ySrc + "px";
      style.zIndex = 0;
      this_.postAddMove(mv, computerMove);
    } else {
      style.left = MOVE_PX(xSrc, xDst, step);
      style.top = MOVE_PX(ySrc, yDst, step);
      step --;
    }
  }, 16);
}

Board.prototype.postAddMove = function(mv, computerMove) {
  if (this.mvLast > 0) {      //要清除"选中"方框,传入selected=false
    this.drawSquare(SRC(this.mvLast), false);
    this.drawSquare(DST(this.mvLast), false);
  }

  //显示这一步走棋的选中方框
  this.drawSquare(SRC(mv), true);
  this.drawSquare(DST(mv), true);
  this.sqSelected = 0;
  this.mvLast = mv;

  if (this.pos.isMate()) {      //如果被将军
    this.playSound(computerMove ? "loss" : "win");
    this.result = computerMove ? RESULT_LOSS : RESULT_WIN;

    var pc = SIDE_TAG(this.pos.sdPlayer) + PIECE_KING;
    var sqMate = 0;
    for (var sq = 0; sq < 256; sq ++) {
      if (this.pos.squares[sq] == pc) {
        sqMate = sq;
        break;
      }
    }
    if (!this.animated || sqMate == 0) {
      this.postMate(computerMove);
      return;
    }

    sqMate = this.flipped(sqMate);
    var style = this.imgSquares[sqMate].style;
    style.zIndex = 256;
    var xMate = SQ_X(sqMate);
    var step = MAX_STEP;
    var this_ = this;
    var timer = setInterval(function() {
      if (step == 0) {
        clearInterval(timer);
        style.left = xMate*sacle + "px";
        style.zIndex = 0;
        this_.imgSquares[sqMate].src = this_.images +
            (this_.pos.sdPlayer == 0 ? "r" : "b") + "km.gif";
        this_.postMate(computerMove);
      } else {
        style.left = (xMate + ((step & 1) == 0 ? step : -step) * 2)*sacle + "px";
        step --;
      }
    }, 50);
    return;
  }

  var vlRep = this.pos.repStatus(3);//在游戏中设为3次,检查是否真的出现了长将。如果出现长将，游戏结束。
  if (vlRep > 0) {
    vlRep = this.pos.repValue(vlRep);
    if (vlRep > -WIN_VALUE && vlRep < WIN_VALUE) {
      this.playSound("draw");
      this.result = RESULT_DRAW;
      alertDelay("双方不变作和，辛苦了?");
    } else if (computerMove == (vlRep < 0)) {
      this.playSound("loss");
      this.result = RESULT_LOSS;
      alertDelay("长打作负，不要气馁?");
    } else {
      this.playSound("win");
      this.result = RESULT_WIN;
      alertDelay("长打作负，祝贺你取得胜利");
    }
    this.postAddMove2();
    this.busy = false;
    return;
  }

  if (this.pos.captured()) {
    var hasMaterial = false;
    for (var sq = 0; sq < 256; sq ++) {
      if (IN_BOARD(sq) && (this.pos.squares[sq] & 7) > 2) {
        hasMaterial = true;
        break;
      }
    }
    if (!hasMaterial) {
      this.playSound("draw");
      this.result = RESULT_DRAW;
      alertDelay("双方都没有进攻棋子子了，辛苦了");
      this.postAddMove2();
      this.busy = false;
      return;
    }
  } else if (this.pos.pcList.length > 100) {
    var captured = false;
    for (var i = 2; i <= 100; i ++) {
      if (this.pos.pcList[this.pos.pcList.length - i] > 0) {
        captured = true;
        break;
      }
    }
    if (!captured) {
      this.playSound("draw");
      this.result = RESULT_DRAW;
      alertDelay("超过步数限着作和，辛苦了");
      this.postAddMove2();
      this.busy = false;
      return;
    }
  }

  if (this.pos.inCheck()) {
    this.playSound(computerMove ? "check2" : "check");
  } else if (this.pos.captured()) {
    this.playSound(computerMove ? "capture2" : "capture");
  } else {
    this.playSound(computerMove ? "move2" : "move");
  }

  this.postAddMove2();
  this.response();
}

Board.prototype.postAddMove2 = function() {
  if (typeof this.onAddMove == "function") {
    this.onAddMove();
  }
}

//将军状态:判断胜负,做出相应回应
Board.prototype.postMate = function(computerMove) {
  alertDelay(computerMove ? "请再接再厉！" : "祝贺你取得胜利！");
  this.postAddMove2();
  this.busy = false;
}

//让电脑回应一步棋
Board.prototype.response = function() {
  if (this.search == null || !this.computerMove()) {
    this.busy = false;
    return;
  }
  this.thinking.style.visibility = "visible";   //让隐藏的thinking.gif可见
  var this_ = this;
  this.busy = true;                           //设置标识为忙
  setTimeout(function() {                     //在thinking.gif显示0.25s后,开始下棋,并再次隐藏图标
    this_.addMove(board.search.searchMain(LIMIT_DEPTH, board.millis), true);
    this_.thinking.style.visibility = "hidden";
  }, 250);
}

/*下一步棋分为选棋-放棋   两步
1、选棋阶段:当前棋盘上尚无棋子被选中
也就是说sqSelected为0。如果点击的是己方棋子，那么直接选中该子
sqSelected = 点 击的位置
2、放棋阶段:当前棋盘上有棋子被选中
也就是说sqSelected不为0。如果这次点击的仍然是己方棋子，这说明用户重新选择了要走的棋子，
sqSelected = 新的点击的位置
如果这次点击的是对方棋子，或者是一个空位置，这说明用户是在走棋。起点是原来选中的位置，终点是当前选中的位置。*/
Board.prototype.clickSquare = function(sq_) {
  if (this.busy || this.result != RESULT_UNKNOWN) {
    return;
  }
  var sq = this.flipped(sq_);
  var pc = this.pos.squares[sq];
  if ((pc & SIDE_TAG(this.pos.sdPlayer)) != 0) {    //如果挪动的是本方棋子
    this.playSound("click");
    if (this.mvLast != 0) {
      this.drawSquare(SRC(this.mvLast), false);
      this.drawSquare(DST(this.mvLast), false);
    }
    if (this.sqSelected) {    //如果被选中棋子存在
      this.drawSquare(this.sqSelected, false);
    }
    this.drawSquare(sq, true);
    this.sqSelected = sq;
  } else if (this.sqSelected > 0) {
    this.addMove(MOVE(this.sqSelected, sq), false);
  }
}

//显示sq位置的棋子图片。如果选中该棋子,显示""选中"方框
Board.prototype.drawSquare = function(sq, selected) {
  var img = this.imgSquares[this.flipped(sq)];
  img.src = this.images + PIECE_NAME[this.pos.squares[sq]] + ".gif";    //文件夹名 + 文件名 + 后缀
  img.style.backgroundImage = selected ? "url(" + this.images + "oos.gif)" : "";    //在背景选添"选定"方框
  img.style.backgroundSize = "100%";
}

//显示棋子图片
Board.prototype.flushBoard = function() {
  this.mvLast = this.pos.mvList[this.pos.mvList.length - 1];
  for (var sq = 0; sq < 256; sq ++) {
    if (IN_BOARD(sq)) {
      this.drawSquare(sq, sq == SRC(this.mvLast) || sq == DST(this.mvLast));
    }
  }
}

//重新开始,重新使用fen串初始化棋局。该方法会调用response()，这就实现了在电脑执红的情况下，电脑先走一步棋的功能。
Board.prototype.restart = function(fen) {
  if (this.busy) {
    return;
  }
  this.result = RESULT_UNKNOWN;
  this.pos.fromFen(fen);
  this.flushBoard();
  this.playSound("newgame");
  this.response();
}

//悔棋
Board.prototype.retract = function() {
  if (this.busy) {
    return;
  }
  this.result = RESULT_UNKNOWN;       //将状态从"胜负已分"->"未知"
  if (this.pos.mvList.length > 1) {   //走法数组不为空,撤销一步棋.否则撤到开始局面,仍然撤回一步,会导致数组异常
    this.pos.undoMakeMove();
  }
  if (this.pos.mvList.length > 1 && this.computerMove()) {
    this.pos.undoMakeMove();
  }
  this.flushBoard();
  this.response();
}

//播放点击音效,直接在html标签内被调用
Board.prototype.setSound = function(sound) {
  this.sound = sound;
  if (sound) {
    this.playSound("click");
  }
}