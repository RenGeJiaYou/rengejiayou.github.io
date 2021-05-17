"use strict";

//希尔排序
var SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093];

function shellSort(mvs, vls) {
  var stepLevel = 1;
  while (SHELL_STEP[stepLevel] < mvs.length) {
    stepLevel ++;
  }
  stepLevel --;
  while (stepLevel > 0) {
    var step = SHELL_STEP[stepLevel];
    for (var i = step; i < mvs.length; i ++) {
      var mvBest = mvs[i];
      var vlBest = vls[i];
      var j = i - step;
      while (j >= 0 && vlBest > vls[j]) {
        mvs[j + step] = mvs[j];
        vls[j + step] = vls[j];
        j -= step;
      }
      mvs[j + step] = mvBest;
      vls[j + step] = vlBest;
    }
    stepLevel --;
  }
}

var PHASE_HASH = 0;
var PHASE_KILLER_1 = 1;
var PHASE_KILLER_2 = 2;
var PHASE_GEN_MOVES = 3;
var PHASE_REST = 4;

//对走法排序
function MoveSort(mvHash, pos, killerTable, historyTable) {
  this.mvs = [];
  this.vls = [];
  this.mvHash = this.mvKiller1 = this.mvKiller2 = 0;
  this.pos = pos;
  this.historyTable = historyTable;
  this.phase = PHASE_HASH;
  this.index = 0;
  this.singleReply = false;

  if (pos.inCheck()) {
    this.phase = PHASE_REST;
    var mvsAll = pos.generateMoves(null);
    for (var i = 0; i < mvsAll.length; i ++) {
      var mv = mvsAll[i]
      if (!pos.makeMove(mv)) {
        continue;
      }
      pos.undoMakeMove();
      this.mvs.push(mv);
      this.vls.push(mv == mvHash ? 0x7fffffff :
          historyTable[pos.historyIndex(mv)]);        //获取历史表
    }
    shellSort(this.mvs, this.vls);
    this.singleReply = this.mvs.length == 1;
  } else {
    this.mvHash = mvHash;
    this.mvKiller1 = killerTable[pos.distance][0];
    this.mvKiller2 = killerTable[pos.distance][1];
  }
}

// 获得一步排序后的走法。如果走法已经全部获取，则返回0
MoveSort.prototype.next = function() {
  switch (this.phase) {
  case PHASE_HASH:
    this.phase = PHASE_KILLER_1;
    if (this.mvHash > 0) {
      return this.mvHash;
    }
    // No Break
  case PHASE_KILLER_1:
    this.phase = PHASE_KILLER_2;
    if (this.mvKiller1 != this.mvHash && this.mvKiller1 > 0 &&
        this.pos.legalMove(this.mvKiller1)) {
      return this.mvKiller1;
    }
    // No Break
  case PHASE_KILLER_2:
    this.phase = PHASE_GEN_MOVES;
    if (this.mvKiller2 != this.mvHash && this.mvKiller2 > 0 &&
        this.pos.legalMove(this.mvKiller2)) {
      return this.mvKiller2;
    }
    // No Break
  case PHASE_GEN_MOVES:
    this.phase = PHASE_REST;
    this.mvs = this.pos.generateMoves(null);
    this.vls = [];
    for (var i = 0; i < this.mvs.length; i ++) {
      this.vls.push(this.historyTable[this.pos.historyIndex(this.mvs[i])]);
    }
    shellSort(this.mvs, this.vls);
    this.index = 0;
    // No Break
  default:
    while (this.index < this.mvs.length) {
      var mv = this.mvs[this.index];
      this.index ++;
      if (mv != this.mvHash && mv != this.mvKiller1 && mv != this.mvKiller2) {
        return mv;
      }
    }
  }
  return 0;
}

var LIMIT_DEPTH = 64;     //最大搜索深度
var NULL_DEPTH = 2;       //空步搜索多减去的搜索值
var RANDOMNESS = 8;

var HASH_ALPHA = 1;
var HASH_BETA = 2;
var HASH_PV = 3;

function Search(pos, hashLevel) {
  this.hashMask = (1 << hashLevel) - 1;//实际传入的hashLevel=16,所以hashMask=65535.用于将哈希函数的“取余运算”，转化为“按位与运算”。
  this.pos = pos;
}

Search.prototype.getHashItem = function() {
  return this.hashTable[this.pos.zobristKey & this.hashMask];
}

Search.prototype.probeHash = function(vlAlpha, vlBeta, depth, mv) {
  var hash = this.getHashItem();
  if (hash.zobristLock != this.pos.zobristLock) {
    mv[0] = 0;
    return -MATE_VALUE;
  }
  mv[0] = hash.mv;
  var mate = false;
  if (hash.vl > WIN_VALUE) {
    if (hash.vl <= BAN_VALUE) {
      return -MATE_VALUE;
    }
    hash.vl -= this.pos.distance;
    mate = true;
  } else if (hash.vl < -WIN_VALUE) {
    if (hash.vl >= -BAN_VALUE) {
      return -MATE_VALUE;
    }
    hash.vl += this.pos.distance;
    mate = true;
  } else if (hash.vl == this.pos.drawValue()) {
    return -MATE_VALUE;
  }
  if (hash.depth < depth && !mate) {
    return -MATE_VALUE;
  }
  if (hash.flag == HASH_BETA) {
    return (hash.vl >= vlBeta ? hash.vl : -MATE_VALUE);
  }
  if (hash.flag == HASH_ALPHA) {
    return (hash.vl <= vlAlpha ? hash.vl : -MATE_VALUE);
  }
  return hash.vl;
}

//记录哈希表
Search.prototype.recordHash = function(flag, vl, depth, mv) {
  var hash = this.getHashItem();
  if (hash.depth > depth) {
    return;
  }
  hash.flag = flag;
  hash.depth = depth;
  if (vl > WIN_VALUE) {
    if (mv == 0 && vl <= BAN_VALUE) {
      return;
    }
    hash.vl = vl + this.pos.distance;
  } else if (vl < -WIN_VALUE) {
    if (mv == 0 && vl >= -BAN_VALUE) {
      return;
    }
    hash.vl = vl - this.pos.distance;
  } else if (vl == this.pos.drawValue() && mv == 0) {
    return;
  } else {
    hash.vl = vl;
  }
  hash.mv = mv;
  hash.zobristLock = this.pos.zobristLock;
}

// 1.更新历史表    2.同时更新杀手走法表。
Search.prototype.setBestMove = function(mv, depth) {
  this.historyTable[this.pos.historyIndex(mv)] += depth * depth;
  var mvsKiller = this.killerTable[this.pos.distance];
  if (mvsKiller[0] != mv) {
    mvsKiller[1] = mvsKiller[0];
    mvsKiller[0] = mv;
  }
}

//水平线效应:达到一个吃子走法，但下一步对手又吃回来，可能局面是一个平手,在叶子节点，局面可能产生剧烈动荡.
//克服水平线效应:一般可采取对叶子节点再向下搜索。同时避免不必要的更深搜索，在叶子节点以下，只搜索吃子走法，因为吃子走法是导致局面剧烈动荡的主要原因。
//即静态（Quiescence）搜索。棋子是有限的，吃子走法不会无限膨胀。静态搜索与Alpha-Beta搜索很相似，主要有以下区别：
// （1）、静态搜索没有深度参数，结束递归调用有两种情况，一是分值大于beta产生剪枝，二是局面不再有吃子走法。
// （2）、如果是被将军的局面，生成所有走法。不是被将军的局面，只生成吃子走法。
// （3）、生成全部走法后，会使用历史表的数据对着法排序，以便提高搜索效率，这叫历史表启发（History Heuristic）。如果只生成吃子走法，使用的是MVV/LVA启发。MVV/LVA的意思是“最有价值的受害者/最没价值的攻击者”(Most Valuable Victim/Least Valuable Attacker)。
//       这个技术假设最好的吃子是吃到最大的子。如果不止一个棋子能吃到最大的子，那么假设用最小的子去吃是最好的。排序之后，会最先搜索最好的吃子走法。
// 此外，我们还通过“将军延伸”的手段来客服水平线效应。也就是说，在Alpha-Beta搜索的过程中，如果遇到被将军的局面，就多向下搜索一层。
Search.prototype.searchQuiesc = function(vlAlpha_, vlBeta) {
  var vlAlpha = vlAlpha_;
  this.allNodes ++;
  // case 1.如果vlBeta值比杀棋分值还小，直接返回杀棋分值
  var vl = this.pos.mateValue();
  if (vl >= vlBeta) {
    return vl;
  }
  //case 2.检查重复局面
  var vlRep = this.pos.repStatus(1);
  if (vlRep > 0) {
    return this.pos.repValue(vlRep);
  }
  //case 3.达到极限深度就返回局面评价
  if (this.pos.distance == LIMIT_DEPTH) {
    return this.pos.evaluate();
  }
  //cae 4.初始化最佳值
  var vlBest = -MATE_VALUE;   // 若最终,值改变了，表明产生了走棋
  var mvs = [], vls = [];
  if (this.pos.inCheck()) {
    //case 5. 若被将军,生成全部走法
    mvs = this.pos.generateMoves(null);
    for (var i = 0; i < mvs.length; i ++) {
      vls.push(this.historyTable[this.pos.historyIndex(mvs[i])]);
    }
    shellSort(mvs, vls);
  } else {
    //case 6. 若未被将军,做局面评估
    vl = this.pos.evaluate();
    if (vl > vlBest) {
      if (vl >= vlBeta) {
        return vl;
      }
      vlBest = vl;
      vlAlpha = Math.max(vl, vlAlpha);
    }
    //case 7. 如果局面评价没有截断，再生成吃子走法
    mvs = this.pos.generateMoves(vls);
    shellSort(mvs, vls);
    for (var i = 0; i < mvs.length; i ++) {
      if (vls[i] < 10 || (vls[i] < 20 && HOME_HALF(DST(mvs[i]), this.pos.sdPlayer))) {
        mvs.length = i;
        break;
      }
    }
  }
  //case 8. 遍历走法,并递归
  for (var i = 0; i < mvs.length; i ++) {
    if (!this.pos.makeMove(mvs[i])) {
      continue;
    }
    vl = -this.searchQuiesc(-vlBeta, -vlAlpha);
    this.pos.undoMakeMove();
     //case 9. 进行a-b大小判断和裁剪
	if (vl > vlBest) {					// 找到最佳值
      if (vl >= vlBeta) {				// 找到一个Beta走法
        return vl;						// Beta截断
      }
      vlBest = vl;						// "vlBest"就是目前要返回的最佳值，可能超出Alpha-Beta边界
      vlAlpha = Math.max(vl, vlAlpha);	// 缩小Alpha-Beta边界
    }
  }
  //case10 .返回最佳值
  return vlBest == -MATE_VALUE ? this.pos.mateValue() : vlBest;
}

//超出边界的ab搜索
Search.prototype.searchFull = function(vlAlpha_, vlBeta, depth, noNull) {
  var vlAlpha = vlAlpha_;   //有一个初始值.不是-∞
  if (depth <= 0) {
    return this.searchQuiesc(vlAlpha, vlBeta);
  }
  this.allNodes ++;
  var vl = this.pos.mateValue();
  if (vl >= vlBeta) {
    return vl;
  }
  var vlRep = this.pos.repStatus(1);
  if (vlRep > 0) {
    return this.pos.repValue(vlRep);
  }
  var mvHash = [0];
  vl = this.probeHash(vlAlpha, vlBeta, depth, mvHash);
  if (vl > -MATE_VALUE) {
    return vl;
  }
  if (this.pos.distance == LIMIT_DEPTH) {
    return this.pos.evaluate();
  }
  if (!noNull && !this.pos.inCheck() && this.pos.nullOkay()) {
    this.pos.nullMove();
    vl = -this.searchFull(-vlBeta, 1 - vlBeta, depth - NULL_DEPTH - 1, true);
    this.pos.undoNullMove();
    if (vl >= vlBeta && (this.pos.nullSafe() ||
        this.searchFull(vlAlpha, vlBeta, depth - NULL_DEPTH, true) >= vlBeta)) {
      return vl;
    }
  }
  var hashFlag = HASH_ALPHA;
  var vlBest = -MATE_VALUE;
  var mvBest = 0;
  var sort = new MoveSort(mvHash[0], this.pos, this.killerTable, this.historyTable);
  var mv;
  while ((mv = sort.next()) > 0) {
    if (!this.pos.makeMove(mv)) {
      continue;
    }
    var newDepth = this.pos.inCheck() || sort.singleReply ? depth : depth - 1;
    if (vlBest == -MATE_VALUE) {
      vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
    } else {
      vl = -this.searchFull(-vlAlpha - 1, -vlAlpha, newDepth, false);
      if (vl > vlAlpha && vl < vlBeta) {
        vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
      }
    }
    this.pos.undoMakeMove();
    if (vl > vlBest) {
      vlBest = vl;
      if (vl >= vlBeta) {
        hashFlag = HASH_BETA;
        mvBest = mv;
        break;
      }
      if (vl > vlAlpha) {
        vlAlpha = vl;
        hashFlag = HASH_PV;
        mvBest = mv;
      }
    }
  }
  if (vlBest == -MATE_VALUE) {
    return this.pos.mateValue();
  }
  this.recordHash(hashFlag, vlBest, depth, mvBest);
  if (mvBest > 0) {
    this.setBestMove(mvBest, depth);
  }
  return vlBest;
}

Search.prototype.searchRoot = function(depth) {
  var vlBest = -MATE_VALUE;
  var sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
  var mv;
  while ((mv = sort.next()) > 0) {
    if (!this.pos.makeMove(mv)) {
      continue;
    }
    var newDepth = this.pos.inCheck() ? depth : depth - 1;
    var vl;
    if (vlBest == -MATE_VALUE) {
      vl = -this.searchFull(-MATE_VALUE, MATE_VALUE, newDepth, true);
    } else {
      vl = -this.searchFull(-vlBest - 1, -vlBest, newDepth, false);
      if (vl > vlBest) {
        vl = -this.searchFull(-MATE_VALUE, -vlBest, newDepth, true);
      }
    }
    this.pos.undoMakeMove();
    if (vl > vlBest) {
      vlBest = vl;
      this.mvResult = mv;
      if (vlBest > -WIN_VALUE && vlBest < WIN_VALUE) {
        vlBest += Math.floor(Math.random() * RANDOMNESS) -
            Math.floor(Math.random() * RANDOMNESS);
        vlBest = (vlBest == this.pos.drawValue() ? vlBest - 1 : vlBest);
      }
    }
  }
  this.setBestMove(this.mvResult, depth);
  return vlBest;
}

Search.prototype.searchUnique = function(vlBeta, depth) {
  var sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
  sort.next();
  var mv;
  while ((mv = sort.next()) > 0) {
    if (!this.pos.makeMove(mv)) {
      continue;
    }
    var vl = -this.searchFull(-vlBeta, 1 - vlBeta,
        this.pos.inCheck() ? depth : depth - 1, false);
    this.pos.undoMakeMove();
    if (vl >= vlBeta) {
      return false;
    }
  }
  return true;
}

Search.prototype.searchMain = function(depth, millis) {
  this.mvResult = this.pos.bookMove();
  if (this.mvResult > 0) {
    this.pos.makeMove(this.mvResult);
    if (this.pos.repStatus(3) == 0) {
      this.pos.undoMakeMove();
      return this.mvResult;
    }
    this.pos.undoMakeMove();
  }
  this.hashTable = [];
  for (var i = 0; i <= this.hashMask; i ++) {
    this.hashTable.push({depth: 0, flag: 0, vl: 0, mv: 0, zobristLock: 0});
  }
  this.killerTable = [];
  for (var i = 0; i < LIMIT_DEPTH; i ++) {
    this.killerTable.push([0, 0]);
  }
  this.historyTable = [];
  for (var i = 0; i < 4096; i ++) {
    this.historyTable.push(0);
  }
  this.mvResult = 0;
  this.allNodes = 0;
  this.pos.distance = 0;
  var t = new Date().getTime();//不采用限定层数的条件,而是直接限定时间.这里是得到t0
  for (var i = 1; i <= depth; i ++) {
    var vl = this.searchRoot(i);
    this.allMillis = new Date().getTime() - t;    //得到耗时 Milllis
    if (this.allMillis > millis) {                //超过搜索时间,break;
      break;
    }
    if (vl > WIN_VALUE || vl < -WIN_VALUE) {
      break;
    }
    if (this.searchUnique(1 - WIN_VALUE, i)) {
      break;
    }
  }
  return this.mvResult;
}

Search.prototype.getKNPS = function() {
  return this.allNodes / this.allMillis;
}