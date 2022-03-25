const WIDTH = 960;
const HEIGHT = 540;
const MAIN_FONTNAME = "sans-serif";
const DIGIT_FONTNAME ="sans-serif";
const JAPANESE_FONTNAME = "sans-serif";
const TYPING_FONTNAME="sans-serif";
const DEBUG_MODE=0;//数字の番号のシーンからスタート ONにするとアバターは毎回更新
var tuningX=[0,0,0,0,0],tuningY=[0,0,0,0,0];//位置の調整用
const IMG_CNT = 0;//読みこむイメージ等の総数
const COEF_R2K=1.65;//ローマ字からカナへのkpm変換の係数
const TEAM_BONUS = 25;//チームのボーナス値　%で指定
var SCENE_ANI=400; //ロード終了後のアニメーション時間(DEBUGMODEによって変更するためvarで宣言)
const WAIT_TIME=300;
const BATTLE_ANI=2500;//バトル開始時のアニメーションの持続時間