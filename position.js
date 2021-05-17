"use strict";

//二分查找,用来在开局库中搜索一个走法,为每次开局制造一些随机性
function binarySearch(vlss, vl) {
  var low = 0;
  var high = vlss.length - 1;
  while (low <= high) {
    var mid = (low + high) >> 1;
    if (vlss[mid][0] < vl) {
      low = mid + 1;
    } else if (vlss[mid][0] > vl) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
}

var MATE_VALUE = 10000;
var BAN_VALUE = MATE_VALUE - 100;
var WIN_VALUE = MATE_VALUE - 200;
var NULL_SAFE_MARGIN = 400;
var NULL_OKAY_MARGIN = 200;
var DRAW_VALUE = 20;
var ADVANCED_VALUE = 3;     //优势

//表示每种棋子,+8表示红方的7种棋子;+16表示黑方的7种棋子
var PIECE_KING = 0;     //将/帅
var PIECE_ADVISOR = 1;  //士/仕
var PIECE_BISHOP = 2;   //相/象
var PIECE_KNIGHT = 3;   //马
var PIECE_ROOK = 4;     //车
var PIECE_CANNON = 5;   //炮
var PIECE_PAWN = 6;     //兵/卒

var RANK_TOP = 3;       //实际棋盘上缘行号
var RANK_BOTTOM = 12;   //实际棋盘下缘行号
var FILE_LEFT = 3;      //实际棋盘左缘列号
var FILE_RIGHT = 11;    //实际棋盘右缘列号

var ADD_PIECE = false;
var DEL_PIECE = true;

//虚拟棋盘(16*16)内的实际棋盘(10*9)
var IN_BOARD_ = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

//检测棋子是否在九宫内
var IN_FORT_ = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

/*一个16*32的数组,可同时检测将,士,象的合法走位
 *将的走位:（-16 + 256）、（-1 + 256）、（1 + 256）、（16 + 256）四个位置是1，其他位置都不是1。
 *士的走位:（-17 + 256）、（-15 + 256）、（15 + 256）、（17 + 256）四个位置是2，其他位置都不是2。
 *象的走位:（-34 + 256）、（-30 + 256）、（30 + 256）、（34 + 256）四个位置是3，其他位置都不是3。
 */
var LEGAL_SPAN = [
                       0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0,
];

/*一个16*32的数组,检测马的合法走位
 *非0数字的下标表示可能的走位,非0数字的值表示对应的别马脚的位置
 *如[-33 + 256]=-16表示一个合法走位是-33的位置,对应的别马脚位置是-16
 *设置变量sqPin满足：
 *sqPin = sqSrc + KNIGHT_PIN_[sqDst - sqSrc + 256]
 *因此马的走法合法，只需要满足sqPin != sqSrc并且sqPin位置无棋子。
 */
var KNIGHT_PIN_ = [
                              0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,-16,  0,-16,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0, -1,  0,  0,  0,  1,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0, -1,  0,  0,  0,  1,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0, 16,  0, 16,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,
];

var KING_DELTA = [-16, -1, 1, 16];//将(帅)的走法,上下左右(见 LEGAL_SPAN 注释)
var ADVISOR_DELTA = [-17, -15, 15, 17];//士的走法,四条斜边(见 LEGAL_SPAN 注释)
var KNIGHT_DELTA = [[-33, -31], [-18, 14], [-14, 18], [31, 33]];//马的走法,内括号表示两个方向共享一个马腿
var KNIGHT_CHECK_DELTA = [[-33, -18], [-31, -14], [14, 31], [18, 33]];
var MVV_VALUE = [50, 10, 10, 30, 40, 30, 20, 0];

//棋子价值数组:棋子价值是跟位置有关系的.价值数组可以判断局面对红方（或黑方）的优势，并把优势量化.
//PIECE_VALUE[7][256]提供了红方的价值参考,使用SQUARE_FLIP(sq) 翻转到黑方
var PIECE_VALUE = [
  //兵的价值数组:中兵价值15，其他四个位置价值都是7。位于九宫的中心位置时，价值达到最高的44.
  //帅的价值数组:数组里的1、2、11、15仅仅表示了帅的位置分值.
  //兵和帅的价值数组交叠在一起.
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  9,  9,  9, 11, 13, 11,  9,  9,  9,  0,  0,  0,  0,
    0,  0,  0, 19, 24, 34, 42, 44, 42, 34, 24, 19,  0,  0,  0,  0,
    0,  0,  0, 19, 24, 32, 37, 37, 37, 32, 24, 19,  0,  0,  0,  0,
    0,  0,  0, 19, 23, 27, 29, 30, 29, 27, 23, 19,  0,  0,  0,  0,
    0,  0,  0, 14, 18, 20, 27, 29, 27, 20, 18, 14,  0,  0,  0,  0,
    0,  0,  0,  7,  0, 13,  0, 16,  0, 13,  0,  7,  0,  0,  0,  0,
    0,  0,  0,  7,  0,  7,  0, 15,  0,  7,  0,  7,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0, 11, 15, 11,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ],
  //士的价值数组 
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0, 20,  0,  0,  0, 20,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0, 18,  0,  0, 20, 23, 20,  0,  0, 18,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0, 20, 20,  0, 20, 20,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ],
  //象的价值数组 
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0, 20,  0,  0,  0, 20,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0, 18,  0,  0, 20, 23, 20,  0,  0, 18,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0, 20, 20,  0, 20, 20,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ],
  //马的价值数组
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0, 90, 90, 90, 96, 90, 96, 90, 90, 90,  0,  0,  0,  0,
    0,  0,  0, 90, 96,103, 97, 94, 97,103, 96, 90,  0,  0,  0,  0,
    0,  0,  0, 92, 98, 99,103, 99,103, 99, 98, 92,  0,  0,  0,  0,
    0,  0,  0, 93,108,100,107,100,107,100,108, 93,  0,  0,  0,  0,
    0,  0,  0, 90,100, 99,103,104,103, 99,100, 90,  0,  0,  0,  0,
    0,  0,  0, 90, 98,101,102,103,102,101, 98, 90,  0,  0,  0,  0,
    0,  0,  0, 92, 94, 98, 95, 98, 95, 98, 94, 92,  0,  0,  0,  0,
    0,  0,  0, 93, 92, 94, 95, 92, 95, 94, 92, 93,  0,  0,  0,  0,
    0,  0,  0, 85, 90, 92, 93, 78, 93, 92, 90, 85,  0,  0,  0,  0,
    0,  0,  0, 88, 85, 90, 88, 90, 88, 90, 85, 88,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ],
  //车的价值数组
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,206,208,207,213,214,213,207,208,206,  0,  0,  0,  0,
    0,  0,  0,206,212,209,216,233,216,209,212,206,  0,  0,  0,  0,
    0,  0,  0,206,208,207,214,216,214,207,208,206,  0,  0,  0,  0,
    0,  0,  0,206,213,213,216,216,216,213,213,206,  0,  0,  0,  0,
    0,  0,  0,208,211,211,214,215,214,211,211,208,  0,  0,  0,  0,
    0,  0,  0,208,212,212,214,215,214,212,212,208,  0,  0,  0,  0,
    0,  0,  0,204,209,204,212,214,212,204,209,204,  0,  0,  0,  0,
    0,  0,  0,198,208,204,212,212,212,204,208,198,  0,  0,  0,  0,
    0,  0,  0,200,208,206,212,200,212,206,208,200,  0,  0,  0,  0,
    0,  0,  0,194,206,204,212,200,212,204,206,194,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ],
  //炮的价值数组
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,100,100, 96, 91, 90, 91, 96,100,100,  0,  0,  0,  0,
    0,  0,  0, 98, 98, 96, 92, 89, 92, 96, 98, 98,  0,  0,  0,  0,
    0,  0,  0, 97, 97, 96, 91, 92, 91, 96, 97, 97,  0,  0,  0,  0,
    0,  0,  0, 96, 99, 99, 98,100, 98, 99, 99, 96,  0,  0,  0,  0,
    0,  0,  0, 96, 96, 96, 96,100, 96, 96, 96, 96,  0,  0,  0,  0,
    0,  0,  0, 95, 96, 99, 96,100, 96, 99, 96, 95,  0,  0,  0,  0,
    0,  0,  0, 96, 96, 96, 96, 96, 96, 96, 96, 96,  0,  0,  0,  0,
    0,  0,  0, 97, 96,100, 99,101, 99,100, 96, 97,  0,  0,  0,  0,
    0,  0,  0, 96, 97, 98, 98, 98, 98, 98, 97, 96,  0,  0,  0,  0,
    0,  0,  0, 96, 96, 97, 99, 99, 99, 97, 96, 96,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ], 
   //卒的价值数组
  [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  9,  9,  9, 11, 13, 11,  9,  9,  9,  0,  0,  0,  0,
    0,  0,  0, 19, 24, 34, 42, 44, 42, 34, 24, 19,  0,  0,  0,  0,
    0,  0,  0, 19, 24, 32, 37, 37, 37, 32, 24, 19,  0,  0,  0,  0,
    0,  0,  0, 19, 23, 27, 29, 30, 29, 27, 23, 19,  0,  0,  0,  0,
    0,  0,  0, 14, 18, 20, 27, 29, 27, 20, 18, 14,  0,  0,  0,  0,
    0,  0,  0,  7,  0, 13,  0, 16,  0, 13,  0,  7,  0,  0,  0,  0,
    0,  0,  0,  7,  0,  7,  0, 15,  0,  7,  0,  7,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0, 11, 15, 11,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  ],
];

//本函数调用IN_BOARD_数组,判断棋子是否越界
function IN_BOARD(sq) {
  return IN_BOARD_[sq] != 0;
}

//本函数调用IN_FORT_数组,判断棋子是否在九宫
function IN_FORT(sq) {
  return IN_FORT_[sq] != 0;
}

//根据一维矩阵,得出二维的y坐标(y=sq/16)
function RANK_Y(sq) {
  return sq >> 4;
}

//根据一维矩阵,得出二维的x坐标(x=sq%16)
function FILE_X(sq) {
  return sq & 15;
}

//根据(x,y)返回一维数组序号
function COORD_XY(x, y) {
  return x + (y << 4);
}

//给出对方对应的棋子(棋盘布局是中心对称的:如红方的右车(10,9)对应于黑方的右车(1,1))
function SQUARE_FLIP(sq) {
  return 254 - sq;
}

//对家相应棋子的x坐标
function FILE_FLIP(x) {
  return 14 - x;
}

//对家相应棋子的y坐标
function RANK_FLIP(y) {
  return 15 - y;
}

//返回对家对应棋子的一维数组序号(x坐标以楚河汉界为对称轴,y坐标一致)
function MIRROR_SQUARE(sq) {
  return COORD_XY(FILE_FLIP(FILE_X(sq)), RANK_Y(sq));
}

/*得到兵/卒向前走了一步的位置
 *红方(sd=0)向前走一步:sqSrc - 16
 *黑方(sd=1)向前走一步:sqSrc + 16
 *根据sd构造函数:合法Des = sqSrc-16+(sd*32)
 */
function SQUARE_FORWARD(sq, sd) {
  return sq - 16 + (sd << 5);
}

//将的走位检测:在LEGAL_SPAN数组中,值==1的位置是将的合法走位
function KING_SPAN(sqSrc, sqDst) {
  return LEGAL_SPAN[sqDst - sqSrc + 256] == 1;
}

//士的走位检测:在LEGAL_SPAN数组中,值==2的位置是士的合法走位
function ADVISOR_SPAN(sqSrc, sqDst) {
  return LEGAL_SPAN[sqDst - sqSrc + 256] == 2;
}

//象的走位检测:在LEGAL_SPAN数组中,值==3的位置是象的合法走位
function BISHOP_SPAN(sqSrc, sqDst) {
  return LEGAL_SPAN[sqDst - sqSrc + 256] == 3;
}

//返回象眼的位置,象眼位于初始位置和目标位置中间,有棋子时值!=0,即为真
function BISHOP_PIN(sqSrc, sqDst) {
  return (sqSrc + sqDst) >> 1;
}

//返回别马腿的位置.当马的方位不合法时,返回值=sqSrc
function KNIGHT_PIN(sqSrc, sqDst) {
  return sqSrc + KNIGHT_PIN_[sqDst - sqSrc + 256];
}

/* sp是棋子位置，sd是走棋方（红方0，黑方1）。
 *检测走棋方当前的棋子是否在本家.在:true;不在:false
 */
function HOME_HALF(sq, sd) {
  return (sq & 0x80) != (sd << 7);
}

/*检测走棋方当前的棋子是否过河.过河:true;未过河:false
 *如果兵已经过河，是可以左右走的，条件函数：
 *AWAY_HALF(sq, sd) && (sqDst == sqSrc - 1 || sqDst == sqSrc + 1)
 *已过河 且 左右移动一格
 */
function AWAY_HALF(sq, sd) {
  return (sq & 0x80) == (sd << 7);
}

/* 检测象是否过河:
 *数组[0]~[127](0000 0000 ~ 0111 1111)是一方;[128]~[255](1000 0000~1111 1111)是另一方
 *若未过河:sqSrc ^ sqDst = 0xxx xxxx (^是异或运算,0^0=0,1^1=0,1^0=1)
 *0xxx xxxx & 1000 0000 = 0 返回true
 *如果从起点sqSrc到终点sqDst没有过河，则返回true；否则返回false
 */
function SAME_HALF(sqSrc, sqDst) {
  return ((sqSrc ^ sqDst) & 0x80) == 0;
}

/*
 *检测棋子的移动是否在同一行
 *最左和最右最多差15(ABCD 0000~ABCD 1111) 显然,移动棋子时高4位不变,异或运算时:
 *sqSrc ^ sqDst = 0000 XXXX
 *0000 XXXX & 1111 0000 =0000 0000
 */
function SAME_RANK(sqSrc, sqDst) {
  return ((sqSrc ^ sqDst) & 0xf0) == 0;
}

/*
 *检测棋子的移动是否在同一列
 *上方目标坐标是AB00 XXXX
 *当前初始坐标是AB01 XXXX(0~255的一个数)
 *下方目标坐标是AB10 XXXX   显然,移动棋子时低四位不变
 *sqSrc ^ sqDst = XXXX 0000
 *XXXX 0000 & 0000 1111 =0000 0000
 */
function SAME_FILE(sqSrc, sqDst) {
  return ((sqSrc ^ sqDst) & 0x0f) == 0;
}

//己方Tag
// 红方=0,返回8
// 黑方=1,返回16
function SIDE_TAG(sd) {
  return 8 + (sd << 3);
}

//对方Tag
// 红方=0,返回16
// 黑方=1,返回8
function OPP_SIDE_TAG(sd) {
  return 16 - (sd << 3);
}

//取16位二进制数的低8位:源地址
function SRC(mv) {
  return mv & 255;
}

//取16位二进制数的高8位:目标地址
function DST(mv) {
  return mv >> 8;
}

//返回一个数,同时包括起点和终点信息.高8位是Dst,低8位是Src
function MOVE(sqSrc, sqDst) {
  return sqSrc + (sqDst << 8);
}

//返回一个数,包括镜像位置的起点和终点信息.高8位是Dst,低8位是Src
function MIRROR_MOVE(mv) {
  return MOVE(MIRROR_SQUARE(SRC(mv)), MIRROR_SQUARE(DST(mv)));
}

function MVV_LVA(pc, lva) {
  return MVV_VALUE[pc & 7] - lva;
}

//接收unicode序号,输出字符 
function CHR(n) {
  return String.fromCharCode(n);
}

//根据字符 输出Unicode数字码
function ASC(c) {
  return c.charCodeAt(0);
}

var FEN_PIECE = "        KABNRCP kabnrcp ";

//根据字符返回棋子的表示值
function CHAR_TO_PIECE(c) {
  switch (c) {
  case "K":
    return PIECE_KING;
  case "A":
    return PIECE_ADVISOR;
  case "B":
  case "E":
    return PIECE_BISHOP;
  case "H":
  case "N":
    return PIECE_KNIGHT;
  case "R":
    return PIECE_ROOK;
  case "C":
    return PIECE_CANNON;
  case "P":
    return PIECE_PAWN;
  default:
    return -1;
  }
}

//RC4加密算法,一个公开的加密算法.用于生成随机数,确定的输入([0])有着确定的输出.
//Random()每次生成的随机码都不一样,这对于象棋游戏来说没有必要.
function RC4(key) {
  this.x = this.y = 0;
  this.state = [];
  for (var i = 0; i < 256; i ++) {
    this.state.push(i);
  }
  var j = 0;
  for (var i = 0; i < 256; i ++) {
    j = (j + this.state[i] + key[i % key.length]) & 0xff;
    this.swap(i, j);
  }
}

RC4.prototype.swap = function(i, j) {
  var t = this.state[i];
  this.state[i] = this.state[j];
  this.state[j] = t;
}

RC4.prototype.nextByte = function() {
  this.x = (this.x + 1) & 0xff;
  this.y = (this.y + this.state[this.x]) & 0xff;
  this.swap(this.x, this.y);
  var t = (this.state[this.x] + this.state[this.y]) & 0xff;
  return this.state[t];
}

RC4.prototype.nextLong = function() {
  var n0 = this.nextByte();
  var n1 = this.nextByte();
  var n2 = this.nextByte();
  var n3 = this.nextByte();
  return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff);
}

// 对于两个局面，如果棋子种类及数量完全一样但走棋方不同，这两个局面是不一样的。
//程序中也为走棋方设立一个随机数，也就是PreGen_zobristKeyPlayer
var PreGen_zobristKeyPlayer, PreGen_zobristLockPlayer;          //都是一个32位数
var PreGen_zobristKeyTable = [], PreGen_zobristLockTable = [];  //都是[14][256]的随机数数组(14种不同的棋子)


/*
(!)为已存在的局面产生一个随机数做校验码,而不是为每一个可能存在的位置都产生一个校验码,问题空间没有32^90那么大
第一步:为当前局面分布在 n 个位置的 n 个棋子生成 n 个随机码R1,R2,R3...Rn(采用RC4加密算法)
第二步:K = R1^R2^R3^....^Rn
XOR的运算特性
（1）、满足结合律：  Ri ^ (Rj ^ Rk) = (Ri ^ Rj) ^ Rk
（2）、满足交换律：  Ri ^ Rj = Rj ^ Ri
（3）、自交为0:     Ri ^ Ri = 0
（4）、K是随机的，并且均匀分布。
第1、2项性质使得计算校验码不用考虑顺序，第3项性质使得删除棋子和棋子移动变得容易。

比如黑车从51位置移动到52位置，只需将校验值K做如下两步处理(注意,此时的 K 已经是和R(黑车, 51)异或的结果)：
K ^ R(黑车, 51) -> (R1^R2^R3^....^Rn-1)^ [R(黑车, 51)^ R(黑车, 51)] -> 在Ri中删除了R(黑车, 51)再 ^ 为新的 K
K ^ R(黑车, 52)->(R1^R2^R3^....^Rn-1)^ R(黑车, 52)

如果52位置有对方的马，则要进一步运算(注意,此时的 K 已经是和R(红马, 52)异或的结果)：
K ^ R(红马, 52) -> 在Ri中删除了R(黑车, 51)再 ^ 为新的 K
*/
var rc4 = new RC4([0]);   //是一个[256]的随机数数组,每个随机数:0~255
PreGen_zobristKeyPlayer = rc4.nextLong();   //得到一个32位二进制数:1099503838
rc4.nextLong();
PreGen_zobristLockPlayer = rc4.nextLong();//创建Zobrist Lock是因为Zobrist Key不足以保证局面的唯一性,两者生成方式是一样的
for (var i = 0; i < 14; i ++) {
  var keys = [];
  var locks = [];
  for (var j = 0; j < 256; j ++) {
    keys.push(rc4.nextLong());
    rc4.nextLong();
    locks.push(rc4.nextLong());
  }
  PreGen_zobristKeyTable.push(keys);
  PreGen_zobristLockTable.push(locks);
}

function Position() {
  // sdPlayer, zobristKey, zobristLock, vlWhite, vlBlack, distance;
  // squares, mvList, pcList, keyList, chkList;
}

Position.prototype.clearBoard = function() {
  this.sdPlayer = 0;
  this.squares = [];    //一个全0的256位(16*16)数组,存放棋子的种类和位置
  for (var sq = 0; sq < 256; sq ++) {
    this.squares.push(0);
  }
  this.zobristKey = this.zobristLock = 0;
  this.vlWhite = this.vlBlack = 0;    //表示双方的棋子价值
};

//初始化函数,声明几个成员变量
Position.prototype.setIrrev = function() {
  this.mvList = [0]; //步骤数组,保存每步的走法,悔棋的时候会用到。
  this.pcList = [0]; //吃子数组，保存每步被吃的棋子。如果这一步没有棋子被吃，那么保存的是0。也会在悔棋的时候用到。
  this.keyList = [0];//校验码数组。每走一步棋，都会把局面的zobristKey校验码存入该数组。
  this.chkList = [this.checked()]; //每走一步棋，都会把当前局面是否被将军，存入该数组。判断是否出现“长将”时会用到。
  this.distance = 0;//步数,超过一定限制,作和
}

//在棋局中的 sq 位置添加进棋子 pc.具体做法是在squares[sq]位置赋给棋子 pc 对应的值
//并在棋子增减时改变时,更新vlWhite和vlBlack.
Position.prototype.addPiece = function(sq, pc, bDel) {
  var pcAdjust;
  this.squares[sq] = bDel ? 0 : pc;//若是删除棋子,该坐标值归零;否则该坐标值 = pc
  if (pc < 16) {//红方
    pcAdjust = pc - 8;
    this.vlWhite += bDel ? -PIECE_VALUE[pcAdjust][sq] : PIECE_VALUE[pcAdjust][sq];
  } else {      //黑方
    pcAdjust = pc - 16;
    this.vlBlack += bDel ? -PIECE_VALUE[pcAdjust][SQUARE_FLIP(sq)] : PIECE_VALUE[pcAdjust][SQUARE_FLIP(sq)];
    pcAdjust += 7;  //+=7是为了在 Zobrist数组 中由红转黑:  红[帅,仕,象,马,车,炮,卒],黑[将,士,象,马,车,炮,卒] .
  }
  this.zobristKey ^= PreGen_zobristKeyTable[pcAdjust][sq];
  this.zobristLock ^= PreGen_zobristLockTable[pcAdjust][sq];
}

//移动棋子:调用addPiece()调整vlwhite / vlblack,调整square[]
Position.prototype.movePiece = function(mv) {
  var sqSrc = SRC(mv);					//源地址
  var sqDst = DST(mv);					//目标地址
  var pc = this.squares[sqDst];			//获取目标位置棋子信息,
  this.pcList.push(pc);					//并添加进列表
  if (pc > 0) {							//若目标位置有棋子,
    this.addPiece(sqDst, pc, DEL_PIECE);//删去这个值,并调整vlwhite,vlblack
  }
  pc = this.squares[sqSrc];				//获取源位置棋子消息,
  this.addPiece(sqSrc, pc, DEL_PIECE);	//删去旧位置的值(离开原位)
  this.addPiece(sqDst, pc, ADD_PIECE);	//添加新位置的值(来到新位)
  this.mvList.push(mv);					 //本次走法入表
}

//movePiece()的逆过程
Position.prototype.undoMovePiece = function() {
  var mv = this.mvList.pop();
  var sqSrc = SRC(mv);
  var sqDst = DST(mv);
  var pc = this.squares[sqDst];
  this.addPiece(sqDst, pc, DEL_PIECE);
  this.addPiece(sqSrc, pc, ADD_PIECE);
  pc = this.pcList.pop();
  if (pc > 0) {
    this.addPiece(sqDst, pc, ADD_PIECE);
  }
}

//切换对战方
Position.prototype.changeSide = function() {
  this.sdPlayer = 1 - this.sdPlayer;
  this.zobristKey ^= PreGen_zobristKeyPlayer;
  this.zobristLock ^= PreGen_zobristLockPlayer;
}

//走一步棋
// 1、删除终点棋子，并记录吃子。
// 2、将起点棋子放在终点。
// 3、保存这一走法。
// 4、切换走棋方。
// 5、发现走棋后会被将,撤销这一步,并返回false;一切正常,返回true
Position.prototype.makeMove = function(mv) {
  var zobristKey = this.zobristKey;
  this.movePiece(mv);         //删除终点棋子，并记录吃子。
  if (this.checked()) {       //如果移动棋子后，发现老将被对方攻击，也就是说这步棋是去送死的，那么就要撤销对棋子的移动，并返回false。
    this.undoMovePiece(mv);
    return false;
  }
  this.keyList.push(zobristKey);
  this.changeSide();        //切换走棋方
  this.chkList.push(this.checked());
  this.distance ++;
  return true;
}

//悔棋
Position.prototype.undoMakeMove = function() {
  this.distance --;
  this.chkList.pop();
  this.changeSide();
  this.keyList.pop();
  this.undoMovePiece();
}

//空着（Null-Move）裁剪
//在前面的搜索过程中，总是本方先走一步棋，再递归调用搜索算法对对手做深度减1的搜索。
//如果本方的优势足够大，以至于少走一步棋，对方也不会占到任何便宜。不走棋，可以说成是执行一步空招。
Position.prototype.nullMove = function() {
  this.mvList.push(0);
  this.pcList.push(0);
  this.keyList.push(this.zobristKey);
  this.changeSide();
  this.chkList.push(false);
  this.distance ++;
}

//撤销空着裁剪
Position.prototype.undoNullMove = function() {
  this.distance --;
  this.chkList.pop();
  this.changeSide();
  this.keyList.pop();
  this.pcList.pop();
  this.mvList.pop();
}

//根据FEN串,绘制棋盘
Position.prototype.fromFen = function(fen) {
  this.clearBoard();
  var y = RANK_TOP;
  var x = FILE_LEFT;
  var index = 0;
  if (index == fen.length) {
    this.setIrrev();
    return;
  }
  var c = fen.charAt(index);
  while (c != " ") {
    if (c == "/") {
      x = FILE_LEFT;
      y ++;
      if (y > RANK_BOTTOM) {
        break;
      }
    } else if (c >= "1" && c <= "9") {
      x += (ASC(c) - ASC("0"));   //ASC()将字符转为Unicode序号,实现了字符->数字的语义转换
    } else if (c >= "A" && c <= "Z") {
      if (x <= FILE_RIGHT) {
        var pt = CHAR_TO_PIECE(c);
        if (pt >= 0) {
          this.addPiece(COORD_XY(x, y), pt + 8);
        }
        x ++;
      }
    } else if (c >= "a" && c <= "z") {
      if (x <= FILE_RIGHT) {
        var pt = CHAR_TO_PIECE(CHR(ASC(c) + ASC("A") - ASC("a")));
        if (pt >= 0) {
          this.addPiece(COORD_XY(x, y), pt + 16);
        }
        x ++;
      }
    }
    index ++;
    if (index == fen.length) {
      this.setIrrev();
      return;
    }
    c = fen.charAt(index);
  }
  index ++;
  if (index == fen.length) {
    this.setIrrev();
    return;
  }
  if (this.sdPlayer == (fen.charAt(index) == "b" ? 0 : 1)) {
    this.changeSide();
  }
  this.setIrrev();
}

//根据棋盘,描述为FEN串
Position.prototype.toFen = function() {
  var fen = "";
  for (var y = RANK_TOP; y <= RANK_BOTTOM; y ++) {
    var k = 0;
    for (var x = FILE_LEFT; x <= FILE_RIGHT; x ++) {
      var pc = this.squares[COORD_XY(x, y)];
      if (pc > 0) {
        if (k > 0) {
          fen += CHR(ASC("0") + k);
          k = 0;
        }
        fen += FEN_PIECE.charAt(pc);
      } else {
        k ++;
      }
    }
    if (k > 0) {
      fen += CHR(ASC("0") + k);
    }
    fen += "/";
  }
  return fen.substring(0, fen.length - 1) +
      (this.sdPlayer == 0 ? " w" : " b");
}

//生成棋局的所有走法
//增加了参数vls。如果vls为null，生成全部走法；否则，只生成吃子走法，并把每步棋的MVV/LVA启发值存入数组vls。
Position.prototype.generateMoves = function(vls) {
  var mvs = [];
  var pcSelfSide = SIDE_TAG(this.sdPlayer);			//本方标记(红方->8，黑方->16)
  var pcOppSide = OPP_SIDE_TAG(this.sdPlayer);		//对方标记(红方->16，黑方->8)
  for (var sqSrc = 0; sqSrc < 256; sqSrc ++) {
    var pcSrc = this.squares[sqSrc];				//得到一个棋子
    if ((pcSrc & pcSelfSide) == 0) {				//对方棋子,跳过
      continue;
    }
    switch (pcSrc - pcSelfSide) {
	//将:
    case PIECE_KING:
      for (var i = 0; i < 4; i ++) {			//将的四个方向
        var sqDst = sqSrc + KING_DELTA[i];		//先得到一个可能的位置
        if (!IN_FORT(sqDst)) {					//出了九宫吗?
          continue;
        }
        var pcDst = this.squares[sqDst];		//获取终点信息
        if (vls == null) {						//生成全部走法
          if ((pcDst & pcSelfSide) == 0) {		//1.是对家棋子   2.位置没有棋子
            mvs.push(MOVE(sqSrc, sqDst));		//合法,保存到数组
          }
        } else if ((pcDst & pcOppSide) != 0) {	//有棋子,且是对家棋子 
          mvs.push(MOVE(sqSrc, sqDst));			//存入
          vls.push(MVV_LVA(pcDst, 5));
        }
      }
      break;
	  //士
    case PIECE_ADVISOR:
      for (var i = 0; i < 4; i ++) {			//仕的4个方向
        var sqDst = sqSrc + ADVISOR_DELTA[i];
        if (!IN_FORT(sqDst)) {					//不在九宫内?
          continue;
        }
        var pcDst = this.squares[sqDst];		//获得终点位置
        if (vls == null) {						//不吃子
          if ((pcDst & pcSelfSide) == 0) {		//1.是对家棋子   2.位置没有棋子 
            mvs.push(MOVE(sqSrc, sqDst));
          }
        } else if ((pcDst & pcOppSide) != 0) {
          mvs.push(MOVE(sqSrc, sqDst));			//记录该吃子走法
          vls.push(MVV_LVA(pcDst, 1));			//记录该吃子走法的分值(MVV/LVA启发)
        }
      }
      break;
	  //象
    case PIECE_BISHOP:
      for (var i = 0; i < 4; i ++) {
        var sqDst = sqSrc + ADVISOR_DELTA[i];		//象眼的位置就是士的走位
        if (!(IN_BOARD(sqDst) && 					//象眼不在棋盘上
		HOME_HALF(sqDst, this.sdPlayer) &&			//或者象眼位置已过河
            this.squares[sqDst] == 0)) {			//或者象眼存在棋子
          continue;
        }
        sqDst += ADVISOR_DELTA[i];
        var pcDst = this.squares[sqDst];
        if (vls == null) {
          if ((pcDst & pcSelfSide) == 0) {
            mvs.push(MOVE(sqSrc, sqDst));
          }
        } else if ((pcDst & pcOppSide) != 0) {
          mvs.push(MOVE(sqSrc, sqDst));				//记录该吃子走法
          vls.push(MVV_LVA(pcDst, 1));				//记录该吃子走法的分值(MVV/LVA启发)
        }
      }
      break;
	  //马
    case PIECE_KNIGHT:
      for (var i = 0; i < 4; i ++) {
        var sqDst = sqSrc + KING_DELTA[i];		//马腿的位置,正好是将的走位
        if (this.squares[sqDst] > 0) {
          continue;
        }
        for (var j = 0; j < 2; j ++) {			//1 个马腿对应2个方向
          sqDst = sqSrc + KNIGHT_DELTA[i][j];
          if (!IN_BOARD(sqDst)) {
            continue;
          }
          var pcDst = this.squares[sqDst];
          if (vls == null) {
            if ((pcDst & pcSelfSide) == 0) {
              mvs.push(MOVE(sqSrc, sqDst));
            }
          } else if ((pcDst & pcOppSide) != 0) {
            mvs.push(MOVE(sqSrc, sqDst));		//记录该吃子走法
            vls.push(MVV_LVA(pcDst, 1));		//记录该吃子走法的分值(MVV/LVA启发)
          }
        }
      }
      break;
	  //车
    case PIECE_ROOK:
      for (var i = 0; i < 4; i ++) {
        var delta = KING_DELTA[i];
        var sqDst = sqSrc + delta;		//向4个可能的方向走一步
        while (IN_BOARD(sqDst)) {
          var pcDst = this.squares[sqDst];
          if (pcDst == 0) {				//终点空位,合法
            if (vls == null) {
              mvs.push(MOVE(sqSrc, sqDst));
            }
          } else {
            if ((pcDst & pcOppSide) != 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              if (vls != null) {
                vls.push(MVV_LVA(pcDst, 4));		//记录该吃子走法的分值(MVV/LVA启发)
              }
            }
            break;
          }
          sqDst += delta;
        }
      }
      break;
	  //炮,和车类似.但多了一个翻山的特征
    case PIECE_CANNON:
      for (var i = 0; i < 4; i ++) {
        var delta = KING_DELTA[i];
        var sqDst = sqSrc + delta;
        while (IN_BOARD(sqDst)) {
          var pcDst = this.squares[sqDst];
          if (pcDst == 0) {
            if (vls == null) {
              mvs.push(MOVE(sqSrc, sqDst));
            }
          } else {
            break;
          }
          sqDst += delta;		//到达阻挡炮的棋子的位置
        }
        sqDst += delta;			//越过该棋子
        while (IN_BOARD(sqDst)) {	//翻山成功
          var pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if ((pcDst & pcOppSide) != 0) {		//翻山后是对方棋子
              mvs.push(MOVE(sqSrc, sqDst));
              if (vls != null) {
                vls.push(MVV_LVA(pcDst, 4));
              }
            }
            break;					//无论什么棋子,翻山后结束走棋
          }
          sqDst += delta;
        }
      }
      break;
	  //兵:
    case PIECE_PAWN:
      var sqDst = SQUARE_FORWARD(sqSrc, this.sdPlayer);
      if (IN_BOARD(sqDst)) {
        var pcDst = this.squares[sqDst];
        if (vls == null) {
          if ((pcDst & pcSelfSide) == 0) {
            mvs.push(MOVE(sqSrc, sqDst));
          }
        } else if ((pcDst & pcOppSide) != 0) {
          mvs.push(MOVE(sqSrc, sqDst));
          vls.push(MVV_LVA(pcDst, 2));
        }
      }
      if (AWAY_HALF(sqSrc, this.sdPlayer)) {
        for (var delta = -1; delta <= 1; delta += 2) {
          sqDst = sqSrc + delta;
          if (IN_BOARD(sqDst)) {
            var pcDst = this.squares[sqDst];
            if (vls == null) {
              if ((pcDst & pcSelfSide) == 0) {
                mvs.push(MOVE(sqSrc, sqDst));
              }
            } else if ((pcDst & pcOppSide) != 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_LVA(pcDst, 2));
            }
          }
        }
      }
      break;
    }
  }
  return mvs;
}

// 判断一个走法是否合法。合法返回true，非法返回false
Position.prototype.legalMove = function(mv) {
  var sqSrc = SRC(mv);	            //取起点坐标
  var pcSrc = this.squares[sqSrc];  //取该坐标的值,识别是什么棋子
  var pcSelfSide = SIDE_TAG(this.sdPlayer);//8(0000 1000) 或16(0001 0000)
  if ((pcSrc & pcSelfSide) == 0) {  //本方不能移动对家棋子
    return false;
  }

  var sqDst = DST(mv);	              //取终点坐标
  var pcDst = this.squares[sqDst];    //取终点坐标值,可知有没有棋子,是什么棋子.
  if ((pcDst & pcSelfSide) != 0) {    //不可以吃自家棋子
    return false;
  }
  
  switch (pcSrc - pcSelfSide) {
  case PIECE_KING:		//将(帅):在九宫内 且 走法正确
    return IN_FORT(sqDst) && KING_SPAN(sqSrc, sqDst);
  case PIECE_ADVISOR:	//士(仕):在九宫内 且 走法正确
    return IN_FORT(sqDst) && ADVISOR_SPAN(sqSrc, sqDst);
  case PIECE_BISHOP:	//象 :未过河 且 走法正确 且未塞象眼
    return SAME_HALF(sqSrc, sqDst) && BISHOP_SPAN(sqSrc, sqDst) &&
        this.squares[BISHOP_PIN(sqSrc, sqDst)] == 0;

  case PIECE_KNIGHT:	//马: 走法正确 且 未别马腿
    var sqPin = KNIGHT_PIN(sqSrc, sqDst);
    return sqPin != sqSrc && this.squares[sqPin] == 0;

  case PIECE_ROOK:		//车
  case PIECE_CANNON:	//炮
    var delta;        //确定移动增量
    if (SAME_RANK(sqSrc, sqDst)) {			//如果在同一行
      delta = (sqDst < sqSrc ? -1 : 1);
    } else if (SAME_FILE(sqSrc, sqDst)) {	//如果在同一列
      delta = (sqDst < sqSrc ? -16 : 16);
    } else {        //不在同一行,也不在同一列.对于炮,车来说算非法
      return false;
    }

    var sqPin = sqSrc + delta;    //不断向选定方向直走
    while (sqPin != sqDst && this.squares[sqPin] == 0) {  //当前位置不是终点 且 无棋子
      sqPin += delta;
    }
    if (sqPin == sqDst) {   //若到达了终点,终点是空位.或者不是空位,但当前棋子是车->就合法
      return pcDst == 0 || pcSrc - pcSelfSide == PIECE_ROOK;
    }
    if (pcDst == 0 || pcSrc - pcSelfSide != PIECE_CANNON) {   //炮翻山必须打中对方棋子
      return false;
    }
    sqPin += delta;
    while (sqPin != sqDst && this.squares[sqPin] == 0) {  //未到达终点,且总是空位,不断直走
      sqPin += delta;
    }
    return sqPin == sqDst;    //最后能到目标位置,即真,否则就假
    
  case PIECE_PAWN:		//卒 过了河 且 左右移动 是合法的
    if (AWAY_HALF(sqDst, this.sdPlayer) && (sqDst == sqSrc - 1 || sqDst == sqSrc + 1)) {
      return true;
    }			//未过河,向前走了一步(黑+16/红-16) 是合法的
    return sqDst == SQUARE_FORWARD(sqSrc, this.sdPlayer);
  default:
    return false;
  }
}

// 判断老将是否被对方攻击。
// 具有攻击性的棋子是车、马、炮、兵。我们要判断对方的这四类棋子是否攻击到了己方老将，
// 以及是否将帅对脸。
Position.prototype.checked = function() {
  var pcSelfSide = SIDE_TAG(this.sdPlayer);     //己方的加成值,若下棋方是红方=8,下棋方是黑方=16
    var pcOppSide = OPP_SIDE_TAG(this.sdPlayer);  //对方的加成值,若下棋方是红方=16,下棋方是黑方=8
    for (var sqSrc = 0; sqSrc < 256; sqSrc ++) {
      if (this.squares[sqSrc] != pcSelfSide + PIECE_KING) {   //找到己方 将 所在位置
        continue;
      }
      //检查兵-前方:将像兵那样向前走一步,若这个位置是对方卒的位置.说明即将被将
      if (this.squares[SQUARE_FORWARD(sqSrc, this.sdPlayer)] == pcOppSide + PIECE_PAWN) {
        return true;
      }
      //检查兵-左右:将像兵那样左右走一步,若这个位置是对方卒的位置.说明即将被将
      for (var delta = -1; delta <= 1; delta += 2) {
        if (this.squares[sqSrc + delta] == pcOppSide + PIECE_PAWN) {
          return true;
        }
      }
      //检查马:如果马腿的位置有棋子,那么该马腿对应的两个方向安全
      //没别马腿:将像马那样走一步,若这个位置是对方马的位置.说明即将被将
      for (var i = 0; i < 4; i ++) {
        if (this.squares[sqSrc + ADVISOR_DELTA[i]] != 0) {
          continue;
        }
        for (var j = 0; j < 2; j ++) {
          var pcDst = this.squares[sqSrc + KNIGHT_CHECK_DELTA[i][j]];
          if (pcDst == pcOppSide + PIECE_KNIGHT) {
            return true;
          }
        }
      }
  
      for (var i = 0; i < 4; i ++) {
        var delta = KING_DELTA[i];
        var sqDst = sqSrc + delta;    //将 可能的四个"方向"
        while (IN_BOARD(sqDst)) {     //若可能位置在棋盘上
          var pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if (pcDst == pcOppSide + PIECE_ROOK || pcDst == pcOppSide + PIECE_KING) {   //遇到车 or 遇到将帅直面
              return true;
            }
            break;
          }
          sqDst += delta;             //向四个方向不断延伸
        }
        sqDst += delta;               //越过一个棋子,检验炮
        while (IN_BOARD(sqDst)) {
          var pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if (pcDst == pcOppSide + PIECE_CANNON) {
              return true;
            }
            break;
          }
          sqDst += delta;
        }
      }
      return false;
    }
    return false;
}

//无棋可走,返回true;否则false
Position.prototype.isMate = function() {
  var mvs = this.generateMoves(null);
  for (var i = 0; i < mvs.length; i ++) {
    if (this.makeMove(mvs[i])) {
      this.undoMakeMove();
      return false;
    }
  }
  return true;
}

//假设红方即将胜利.路径A需要走4步,路径B只要走1步.则判定路径B更好.判定函数如下:
Position.prototype.mateValue = function() {
  return this.distance - MATE_VALUE;
}

Position.prototype.banValue = function() {
  return this.distance - BAN_VALUE;
}

Position.prototype.drawValue = function() {
  return (this.distance & 1) == 0 ? -DRAW_VALUE : DRAW_VALUE;
}

// 每次调用addPiece(sq, pc, bDel)增删棋子时，都会更新vlWhite和vlBlack。获取红方优势的局面评估函数：
//每次调用addPiece(sq, pc, bDel)增删棋子时，都会更新vlWhite和vlBlack。
//先手是有优势的,为了量化这种优势,补充 ADVANCED_VALUE=3
Position.prototype.evaluate = function() {
  var vl = (this.sdPlayer == 0 ? this.vlWhite - this.vlBlack :
      this.vlBlack - this.vlWhite) + ADVANCED_VALUE;
  return vl == this.drawValue() ? vl - 1 : vl;
}

Position.prototype.nullOkay = function() {
  return (this.sdPlayer == 0 ? this.vlWhite : this.vlBlack) > NULL_OKAY_MARGIN;
}

Position.prototype.nullSafe = function() {
  return (this.sdPlayer == 0 ? this.vlWhite : this.vlBlack) > NULL_SAFE_MARGIN;
}

Position.prototype.inCheck = function() {
  return this.chkList[this.chkList.length - 1];
}

Position.prototype.captured = function() {
  return this.pcList[this.pcList.length - 1] > 0;
}

Position.prototype.repValue = function(vlRep) {
  var vlReturn = ((vlRep & 2) == 0 ? 0 : this.banValue()) +
      ((vlRep & 4) == 0 ? 0 : -this.banValue());
  return vlReturn == 0 ? this.drawValue() : vlReturn;
}

//检查重复局面,准备判和
// 每走一步就把局面记录下来，比较当前局面与前几个局面是否相同。
//当重复局面发生时，就要根据双方的将军情况来判定胜负——单方面长将者判负（返回杀棋分数而不必继续搜索了），双长将或双方都存在非将走法则判和（返回和棋分数）。
Position.prototype.repStatus = function(recur_) {
  var recur = recur_;
  var selfSide = false;
  var perpCheck = true;
  var oppPerpCheck = true;
  var index = this.mvList.length - 1;
  while (this.mvList[index] > 0 && this.pcList[index] == 0) {
    if (selfSide) {
      perpCheck = perpCheck && this.chkList[index];
      if (this.keyList[index] == this.zobristKey) {
        recur --;
        if (recur == 0) {
          return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0);
        }
      }
    } else {
      oppPerpCheck = oppPerpCheck && this.chkList[index];
    }
    selfSide = !selfSide;
    index --;
  }
  return 0;
}

Position.prototype.mirror = function() {
  var pos = new Position();
  pos.clearBoard();
  for (var sq = 0; sq < 256; sq ++) {
    var pc = this.squares[sq];
    if (pc > 0) {
      pos.addPiece(MIRROR_SQUARE(sq), pc);
    }
  }
  if (this.sdPlayer == 1) {
    pos.changeSide();
  }
  return pos;
}

// 获取开局库中的走法。
Position.prototype.bookMove = function() {
  if (typeof BOOK_DAT != "object" || BOOK_DAT.length == 0) {
    return 0;
  }
  var mirror = false;
  var lock = this.zobristLock >>> 1; // 使用>>>,在除以二的同时保证为正数
  var index = binarySearch(BOOK_DAT, lock);
  if (index < 0) {
    mirror = true;
    lock = this.mirror().zobristLock >>> 1; // 使用>>>,在除以二的同时保证为正数
    index = binarySearch(BOOK_DAT, lock);
  }
  if (index < 0) {
    return 0;
  }
  index --;
  while (index >= 0 && BOOK_DAT[index][0] == lock) {
    index --;
  }
  var mvs = [], vls = [];
  var value = 0;
  index ++;
  while (index < BOOK_DAT.length && BOOK_DAT[index][0] == lock) {
    var mv = BOOK_DAT[index][1];
    mv = (mirror ? MIRROR_MOVE(mv) : mv);
    if (this.legalMove(mv)) {
      mvs.push(mv);
      var vl = BOOK_DAT[index][2];
      vls.push(vl);
      value += vl;
    }
    index ++;
  }
  if (value == 0) {
    return 0;
  }
  value = Math.floor(Math.random() * value);
  for (index = 0; index < mvs.length; index ++) {
    value -= vls[index];
    if (value < 0) {
      break;
    }
  }
  return mvs[index];
}

//不是常见的 mv(src,dst),而是"棋子类别" + "走法终点位置"
Position.prototype.historyIndex = function(mv) {
  return ((this.squares[SRC(mv)] - 8) << 8) + DST(mv);
}