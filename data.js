var t = 0; //グローバルタイム 毎ターンperformance.now()を格納
var scene=0;//シーン遷移  0:ローディング画面　1:タイトル画面
var nextScene=0;//次のシーン
var sceneAni=0;//シーンのアニメーション
var ctx2d,ctx2dImg,ctx2dSt,ctx2dCr,ctx2dSt2,ctx2d2,ctxHid;//キャンバス（メイン）とキャンバス（背景画像）とキャンバス（静止用）
var canHid;
// ctx2d 動く一番上　＞　ctx2dSt2 静止の一番上　＞　ctx2d メインキャンバス　＞　ctx2dSt 静止用　＞　ctx2dCr　サークル用　＞　ctx2dImg　背景用　の順番に積み上げ
var mouseX=0,mouseY=0,clickX=0,clickY=0,mouseStatus=0,delayMouseX=WIDTH/2,delayMouseY=HEIGHT/2;
var backImg= [],imgLoadedCnt=0;//背景イメージ格納用
var starImg=[];//スターの画像格納用
var otherPartsImg=[];//冠、剣の画像
var coinImg,arrowImg;//コインと矢印の画像
var pWinImg,kWinImg,nWinImg;
var silhoutteImg=[];//シルエットの画像
var efImg=[];
var firstLaunchFlg=0;//初回起動を検知するフラグ
var selectParts=0,selectPartsAni=0;//着せかえ画面で選択中のパーツを保存
var battleAni=0,enemyAvatorData,battleResult,battleStatus=0,typedText="",enemyTypedText="",totalLossTime=0,lossTimeT=0,lossTimeSum=0,getWord=0;//バトルデータの保持用 battlestatusは0ならアニメーション中、1ならカウントダウン中、2ならゲーム中、3ならゲームの待機中、4なら終了アニメーション中
var missAni=0,missChar=0,enemyMissAni=0,enemyMissChar=0,lastKpm=0,wordT=0,lastKpmE=0,resultAni=0,enemyTypingCharNum=0;//missAniはミスをした時のtを格納　missCharはミスした位置
var selectBattleAvator=0,selectBattleAvatorClass=0,selectBattleAvatorAni=0,winLoseAni=0;//選択中のバトルアバター
var showEnemyAvator=[];//tempLocalAvatorから加工したアバターデータを格納
var onlineAvatorCol=[],onlineAvatorOrder=0,onlineAvatorStyle=[1,1],onlineShowPage=0,onlineMyStyle=0;//表示オプション
var createAvatorStyle=0,dataFetchStatus=0,dataSaveStatus=0;//datafetchstatusは0が待機中、1は読み込み済み、2はエラー
var deleteClass=0;
let countDownSec;//カウントダウンを保持用
let lastBGMID;//BGMのsetTimeOutのID保持用
if(localStorage.getItem("avatorData") == null) firstLaunchFlg=1;

var playData; //システムデータ系
var battleData;
var localAvator;
var todayBattleData;
var dailyMission={};
var avatorData;
var battleDataSave;
var tempLocalAvator;

function getNextLvExp(myPlayData,ratioMode,offSet){ //次レベルまでの必要EXPを計算する ratioModeが1なら現状の達成割合を返す
    let lv=myPlayData.level;
    let tempExp=8,prevTempExp=0;
    if(offSet == undefined || isNaN(offSet)) offSet=0;//アニメーション用のズレ
    for(let i = 2;i <= lv;i++){
        prevTempExp=tempExp;
        tempExp=Math.floor(tempExp*1.05+(i+1)*10);
    }
    if(ratioMode){
        if(lv==99) return 1;
        return Math.min(1,Math.max(0,(myPlayData.exp-prevTempExp-offSet)/(tempExp-prevTempExp)));
    } else{
        return tempExp-myPlayData.exp+offSet;
    }
}
function getLvExp(lv){//レベルだけから必要Expを計算する関数
    let tempExp=8;
    if(lv==0) return 0;
    for(let i = 2;i <= lv;i++){
        prevTempExp=tempExp;
        tempExp=Math.floor(tempExp*1.05+(i+1)*10);
    }
    return tempExp;
}
function getNextStarKPM(myAvatorData,myBattleData,ratioMode){ //次のスターまでの必要KPMを計算する
    // 2つの入力方式のうち高い方の数値を採用 ただしその方式における入力数が500未満なら他を採用
    //返却するのは構造体　{style:入力方式　value:値}　ratioMode==0の時、値は必要なKPMの値をそのまま返す
    //myAvatorDataは配列で渡す！
    let star=myAvatorData[0].star;
    if(star==29) return "MAX_LEVEL";
    let style=1;
    if(KPM_STAR[0][star+1]-myAvatorData[0].typingData.kpm <KPM_STAR[1][star+1]- myAvatorData[1].typingData.kpm || isNaN(myAvatorData[1].typingData.kpm)) style=0;
    if(myAvatorData[style].typingData.stroke < 500) style=1-style;
    if(ratioMode){
        return {value:Math.min(1,myAvatorData[style].typingData.kpm/KPM_STAR[style][star+1]),style:style};
    } else{
        return {value:Math.max(0,KPM_STAR[style][star+1]),style:style};
    }
}
function getNextStarStroke(myAvatorData,myBattleData,ratioMode){ //次のスターまでの必要打鍵数を計算する
    let star=myAvatorData[0].star;
    if(star==29) return "MAX_LEVEL";
    if(ratioMode){
        return Math.max(0,(myBattleData.stroke-STROKE_STAR[star])/(STROKE_STAR[star+1]-STROKE_STAR[star])); 
    } else{
        return Math.max(0,STROKE_STAR[star+1]-myBattleData.stroke);
    }
}

function getRGBA(col,T,t,r,g,b){
    // 色の指定に使う関数　Tは点滅の周期(0で点滅なし)、tはカウント用、固定透明度 colに-1を指定するとr,g,bが有効
    const COLSET = [[0,0,0], //BLACK
                    [15,15,25], // DARK GRAY BLUE
                    [240,240,240],// WHITE
                    [160,25,15],//DEEP RED
                    [107,76,0], //黄土色
                    [111,28,3],//茶色
                    [83,10,140],//紫色
                    [255,234,145],//クリーム色
                    [180,30,20],//やや明るい赤
                    [180,180,180],//灰色　９
                    [120,205,120], //黄緑10
                    [100,0,0],//くらい赤 11
                    [210,180,0],//明るい黄色 12
                    [20,20,80],//暗い青　13
                    [200,50,17],//オレンジ 14
                    []
                ];
    if(col>=0){
        r=COLSET[col][0];
        g=COLSET[col][1];
        b=COLSET[col][2];
    }
    if(T){
        return "rgba("  + r + "," + g + "," + b + "," + (0.4+0.3*Math.sin(t/T*Math.PI*2)) + ")";
    } else{
        return "rgba("  + r + "," + g + "," + b + ","+t+")";
    }
}
function processShowData(data,mode){//データ表示時にNaNなどが表示されないようにする関数 modeが1なら、0を---と表示
    if(mode == 1 && data == 0) return "---";
    if(isNaN(data) || (data == undefined) || (data == null) || (data == -1)) return "---";
    return data;
}
function getGraphPos(x,y){//KPMグラフの表示座標を取得する関数
    return {x:Number(173 * x+312),y:Number(71*y+291)};
}
function getPseudoRandom(max,mode){//現在の日付から疑似乱数を返す //maxは最大値　//modeは乱数のモード
    if(max == undefined) max = 10000;
    if(mode == undefined) mode=0;
    const RANDOM_PRIME_RAW=[
        7257,7247,7243,7219,7213,7211,8069,8061,8087,7727,7741,7753,
        6121,6131,6133,6353,6359,6361,6367,6581,6983,6991,6977,6799,
        9011,9013,8431,7187,7193,7451,7457,6983,6991,6803,6991,8053]
    var RANDOM_PRIME=[];
    for(let i = 0;i < 12;i++){
        RANDOM_PRIME[i]=RANDOM_PRIME_RAW[(i+mode)%RANDOM_PRIME_RAW.length];
    }
    let myDate = new Date();
    myDate.setHours(myDate.getHours() - 5);
    if(myDate.getSeconds()==0) myDate.setMinutes(myDate.getMinutes() - 1);
    let day = myDate.getDay();//曜日
    let y_dash = myDate.getFullYear()-2000;
    let month = myDate.getMonth()+1;
    let r1 = Math.floor(((y_dash*RANDOM_PRIME[0]*12*31+month*RANDOM_PRIME[1]*12+day*RANDOM_PRIME[2])%1000)/10)%10;
    let r2 = Math.floor(((y_dash*RANDOM_PRIME[3]*12*31+month*RANDOM_PRIME[4]*12+day*RANDOM_PRIME[5])%1000)/10)%10;
    let r3 = Math.floor(((y_dash*RANDOM_PRIME[6]*12*31+month*RANDOM_PRIME[7]*12+day*RANDOM_PRIME[8])%1000)/10)%10;
    let r4 = Math.floor(((y_dash*RANDOM_PRIME[9]*12*31+month*RANDOM_PRIME[10]*12+day*RANDOM_PRIME[11])%1000)/10)%10;
    let r = r1*1000+r2*100+r3*10+r4;
    return r % max;
}
function getMissionText(myMission){//ミッションのテキストを返す関数
    if(myMission.type==0){
        return myMission.max + "打鍵打とう";
    } else if(myMission.type == 1){
        return myMission.max + "勝しよう";
    }else if(myMission.type == 2){
        return myMission.max + "ワード奪取しよう";
    }else if(myMission.type == 3){
        return TEAM_TEXT[myMission.team]+"チームに" + myMission.max + "勝しよう";
    }else if(myMission.type == 4){
        return TEAM_TEXT[myMission.team]+"チームと" + myMission.max + "回戦おう";
    }else if(myMission.type == 5){
        return "正確性" + myMission.require+"%以上で" + myMission.max + "勝しよう";
    }else if(myMission.type == 6){
        return "CP" + myMission.require+"以上で" + myMission.max + "勝しよう";
    }else if(myMission.type == 7){
        return "CP" + myMission.require+"以上のアバターに" + myMission.max + "勝しよう";
    }else if(myMission.type == 8){
        return myMission.require+"ワード以上奪取して" + myMission.max + "勝しよう";
    }else if(myMission.type == 9){
        return "CP" + myMission.require+"以上のアバターに完全勝利しよう";
    }else if(myMission.type == 10){
        return "CP" + myMission.require+"以上のアバターにPF勝利しよう";
    }else if(myMission.type == 11){
        return TEAM_TEXT[myMission.team]+"チームから" + myMission.max + "ワード奪取しよう";
    }else if(myMission.type == 12){
        return TEAM_TEXT[myMission.team]+"チームのアバターに" + myMission.max + "打鍵しよう";
    }else if(myMission.type == 13){
        return "ユーザーアバターに" + myMission.max + "勝しよう";
    }
}
function generateAvatorData(myAvatorDataRawNum){
    //イベントアバターのタイピングデータをセットする関数　kpm、accなどの設定値に基づく cpは利用しない
    //全体的な強さはスターに基づく　スター12で5番目のデフォルトアバター並の強さ
    let myAvatorData={};
    myAvatorData.name = EVENT_ENEMY_DATA[myAvatorDataRawNum].name;
    myAvatorData.team = EVENT_ENEMY_DATA[myAvatorDataRawNum].team;
    myAvatorData.star = EVENT_ENEMY_DATA[myAvatorDataRawNum].star;
    myAvatorData.level = EVENT_ENEMY_DATA[myAvatorDataRawNum].level;
    myAvatorData.item = EVENT_ENEMY_DATA[myAvatorDataRawNum].item;
    myAvatorData.style = EVENT_ENEMY_DATA[myAvatorDataRawNum].style;
    myAvatorData.kind = EVENT_ENEMY_DATA[myAvatorDataRawNum].kind;
    myAvatorData.id = EVENT_ENEMY_DATA[myAvatorDataRawNum].id;
    myAvatorData.dropItem = EVENT_ENEMY_DATA[myAvatorDataRawNum].dropItem;
    myAvatorData.dropProb = EVENT_ENEMY_DATA[myAvatorDataRawNum].dropProb;
    myAvatorData.typingData={stroke:20,miss:0};
    myAvatorData.typingData.kpm = EVENT_ENEMY_DATA[myAvatorDataRawNum].typingData.kpm;
    myAvatorData.typingData.acc = EVENT_ENEMY_DATA[myAvatorDataRawNum].typingData.acc;
    myAvatorData.typingData.kpm = myAvatorData.typingData.kpm * (1+(Math.sin(getPseudoRandom(100,myAvatorData.star)))*0.05);
    i = myAvatorData.star/2.5;
    myAvatorData.typingData.kpm=Math.floor(myAvatorData.typingData.kpm)
    if(myAvatorData.style) {
        myAvatorData.cp=Math.floor(myAvatorData.typingData.kpm * COEF_R2K);
    } else{
        myAvatorData.cp = myAvatorData.typingData.kpm;
    }
    myAvatorData.typingData.firstSpeed=Math.max(420,625-(i-3)*20);
    myAvatorData.typingData.missChain=2+Math.sin(i*1.1)*2;
    myAvatorData.typingData.cong={prob:Math.max(0.005,0.08-i*0.01),key:1.1+Math.sin(i*1.23),count:1};
    myAvatorData.typingData.keyData=[];
    for(let j = 0;j < ALL_CHARA_SET.length+1;j++){
        myAvatorData.typingData.keyData[j]={acc:(95+4*Math.sin(i*1.2+j*1.3)),kpm:myAvatorData.typingData.kpm*(1+0.5*Math.sin(i*1.22+j*1.18)),stability:(0.5+0.5*Math.sin(i+j*1.2)),totalStroke:5};
    }
    myAvatorData.typingData.optData=[];
    for(let j = 0;j < OPT_SET.length;j++){
        myAvatorData.typingData.optData[j] = {total:100,count:Math.floor((i/5)*(i/5)*(50+50*Math.sin(i*0.5+j*0.2*j)))};
    }
    myAvatorData.typingData.speedTensor=[];
    for(let j = 0;j < CLASS_KPM_RATIO.length;j++){
        myAvatorData.typingData.speedTensor[j]=[];
        for(let k = 0;k < CLASS_KPM_RATIO.length;k++){
            myAvatorData.typingData.speedTensor[j][k]=[];
            for(let l = 0;l < CLASS_KPM_RATIO.length;l++){
                myAvatorData.typingData.speedTensor[j][k][l] = {kpm:(1+0.5*Math.sin(j*0.7+k*0.8+l*0.9))*myAvatorData.typingData.kpm,totalStroke:1};
            } 
        }  
    }
    return myAvatorData;
}

function setEventAvator(event){
    //イベントアバターをリセット、セットする関数
    localAvator[1] = [];
    for(let i = 0;i < EVENT_ENEMY_DATA.length;i++){//最大6体出現
        if((getPseudoRandom(100,i)%100) <= EVENT_ENEMY_DATA[i].prob){
            if(EVENT_ENEMY_DATA[i].event == undefined || EVENT_ENEMY_DATA[i].event.includes(Number(event))){
                //出現
                let tempEventAvatorData  = generateAvatorData(i);
                //チーム設定処理
                if(tempEventAvatorData.name.indexOf("*") != -1){
                    if(event>=1 && event <= 3){
                        tempEventAvatorData.name = tempEventAvatorData.name.replace("*",TEAM_TEXT_JPN[event%3]);
                        tempEventAvatorData.team = event%3;
                        for(let j = 0;j < 5;j++){
                            if(tempEventAvatorData.item[j] == -1) tempEventAvatorData.item[j]=(tempEventAvatorData.team+1)%3;
                        }    
                    } else{
                        let eventEnemyTeam = getPseudoRandom(120,5+i)%3;
                        tempEventAvatorData.name = tempEventAvatorData.name.replace("*",TEAM_TEXT_JPN[eventEnemyTeam]);
                        tempEventAvatorData.team = eventEnemyTeam;
                        for(let j = 0;j < 5;j++){
                            if(tempEventAvatorData.item[j] == -1) tempEventAvatorData.item[j]=eventEnemyTeam+1;
                        }    
                    }
                }
                //push
                localAvator[1].push(tempEventAvatorData);
                if(tempEventAvatorData.dropItem!=undefined) dailyMission.rare=1;//ドロップするキャラが出現していたらレア
            }
        }
        if(localAvator[1].length >= 6) break;
    }
    if(localAvator[1].length == 0 && dailyMission.event){//イベント期間中に出現していなかったら
        //出現
        let tempEventAvatorData  = generateAvatorData(3);
        //チーム設定処理
        if(tempEventAvatorData.name.indexOf("*") != -1){
            tempEventAvatorData.name = tempEventAvatorData.name.replace("*",TEAM_TEXT_JPN[event%3]);
            tempEventAvatorData.team = event%3;
            for(let j = 0;j < 5;j++){
                if(tempEventAvatorData.item[j] == -1) tempEventAvatorData.item[j]=event;
            }
        }
        //push
        localAvator[1].push(tempEventAvatorData);        
    }
}
function setDailyMission(){ //その日のデイリーミッションをセットし、その日のデータをリセットする関数
    let myDate = new Date();
    myDate.setHours(myDate.getHours() - 5);
    if(myDate.getSeconds()==0) myDate.setMinutes(myDate.getMinutes() - 1);
    let day = myDate.getDay();//曜日
    let inputStyle=0;
    dailyMission.battle=0;
    dailyMission.win=0;
    dailyMission.totalStroke=0;
    dailyMission.word=0;
    dailyMission.rare=0;
    if(avatorData[0].typingData.stroke==0) inputStyle=1;
    let baseKPM=avatorData[inputStyle].typingData.cp;
    if(baseKPM<100 || isNaN(baseKPM)) baseKPM=150;
    if(day == 2) {//火曜日
        dailyMission.event=1;
    } else if(day == 3){//水
        dailyMission.event=2;
    } else if(day == 5){ //金
        dailyMission.event=3;
    } else if(day == 6){//土
        dailyMission.event=4;
    } else if(day == 0){//日
        dailyMission.event=5;
    } else{
        dailyMission.event=0;
    }
    dailyMission.date=day;
    let myRand=[];
    for(let i = 0;i < 3;i++){
        myRand[i]= getPseudoRandom(10000,i); //0-9999までの乱数を格納
        if(dailyMission.event != 0 && i!=2){ //上2つはイベント関連ミッション
            dailyMission.detail[i].require=0;
            if(myRand[i] % 4==0){
                dailyMission.detail[i].type = 3;
                dailyMission.detail[i].max=myRand[i] % 8+3;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*3;
            } else if(myRand[i] % 4==1){
                dailyMission.detail[i].type = 4;
                dailyMission.detail[i].max=myRand[i] % 11+5;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*2;
            } else if(myRand[i] % 4==2){
                dailyMission.detail[i].type = 11;
                dailyMission.detail[i].max=(myRand[i] % 8)*10+30;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*0.2;
            } else if(myRand[i] % 4==3){
                dailyMission.detail[i].type = 12;
                dailyMission.detail[i].max=(myRand[i] % 7)*500+1000;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*0.01;
            }
            dailyMission.detail[i].team = (dailyMission.event)%3;
            dailyMission.detail[i].progress=0;
        } else{
            dailyMission.detail[i].team=-1;
            dailyMission.detail[i].require=0;
            if(myRand[i] %42 <= 4){//〇〇打鍵打とう
                dailyMission.detail[i].type = 0;
                dailyMission.detail[i].max=(myRand[i] % 14)*500+1000;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*0.005;
            } else if(myRand[i] %42<= 9){
                dailyMission.detail[i].type = 1;
                dailyMission.detail[i].max=myRand[i] % 8+3;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*2;        
            } else if(myRand[i]%42 <= 14){
                dailyMission.detail[i].type = 2;
                dailyMission.detail[i].max=(myRand[i] % 16)*10+50;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*0.1;
            } else if(myRand[i]%42 <= 16){
                dailyMission.detail[i].type = 3;
                dailyMission.detail[i].max=myRand[i] % 8+3;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*3;
                dailyMission.detail[i].team=Math.floor(myRand[i]/100)%3;
            } else if(myRand[i]%42 <= 18){
                dailyMission.detail[i].type = 4;
                dailyMission.detail[i].max=(myRand[i] % 11)+5;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*2;     
                dailyMission.detail[i].team=Math.floor(myRand[i]/100)%3; 
            } else if(myRand[i]%42 <= 21){
                dailyMission.detail[i].type = 5;
                dailyMission.detail[i].max=myRand[i] % 4+2;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*3;
                dailyMission.detail[i].require=Math.floor(myRand[i] / 10)%5+95;
                dailyMission.detail[i].achieve*=(1+(dailyMission.detail[i].require-95)/10);
            } else if(myRand[i]%42 <= 24){
                dailyMission.detail[i].type = 6;
                dailyMission.detail[i].max=myRand[i] % 5+2;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*2;
                dailyMission.detail[i].require=(Math.floor(myRand[i] / 10)%6)/10+0.7;
                dailyMission.detail[i].achieve*=((dailyMission.detail[i].require*2)-0.4);
                dailyMission.detail[i].require*=baseKPM;
                dailyMission.detail[i].require=Math.floor(dailyMission.detail[i].require/5)*5;
            } else if(myRand[i]%42 <= 28){
                dailyMission.detail[i].type = 7;
                dailyMission.detail[i].max=myRand[i] % 5+2;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*2.5;
                dailyMission.detail[i].require=(Math.floor(myRand[i] / 10)%6)/10+0.7;
                dailyMission.detail[i].achieve*=((dailyMission.detail[i].require*2)-0.4);
                dailyMission.detail[i].require*=baseKPM;
                dailyMission.detail[i].require=Math.floor(dailyMission.detail[i].require/5)*5;
            } else if(myRand[i]%42 <= 31){
                dailyMission.detail[i].type = 8;
                dailyMission.detail[i].max=myRand[i] % 5+2;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*2.5;
                dailyMission.detail[i].require=Math.floor(myRand[i] / 10)%6+15;
                dailyMission.detail[i].achieve*=(1+(dailyMission.detail[i].require-15)/10);
            } else if(myRand[i]%42 <= 33){
                dailyMission.detail[i].type = 9;
                dailyMission.detail[i].max=1;
                dailyMission.detail[i].require=(myRand[i] % 4)*0.1+0.7;
                dailyMission.detail[i].achieve=10*(1+(dailyMission.detail[i].require-0.7)*2.5);
                dailyMission.detail[i].require*=baseKPM;
                dailyMission.detail[i].require=Math.floor(dailyMission.detail[i].require/5)*5;
            } else if(myRand[i]%42 <= 34){
                dailyMission.detail[i].type = 10;
                dailyMission.detail[i].max=1;
                dailyMission.detail[i].require=(myRand[i] % 4)*0.1+0.5;
                dailyMission.detail[i].achieve=20*(1+(dailyMission.detail[i].require-0.5)*2.5);
                dailyMission.detail[i].require*=baseKPM;
                dailyMission.detail[i].require=Math.floor(dailyMission.detail[i].require/5)*5;
            } else if(myRand[i]%42 <= 36){
                dailyMission.detail[i].type = 11;
                dailyMission.detail[i].max=(myRand[i] % 13)*10+30;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*0.2;
                dailyMission.detail[i].team=Math.floor(myRand[i]/100)%3;
            } else if(myRand[i]%42 <= 38){
                dailyMission.detail[i].type = 12;
                dailyMission.detail[i].max=(myRand[i] % 7)*500+1000;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*0.01;
                dailyMission.detail[i].team=Math.floor(myRand[i]/100)%3;
            } else if(myRand[i]%42 <= 41){
                dailyMission.detail[i].type = 13;
                dailyMission.detail[i].max=myRand[i] % 8+3;
                dailyMission.detail[i].achieve=dailyMission.detail[i].max*4;
            } 
        }
        dailyMission.detail[i].progress=0;
        dailyMission.detail[i].max=Math.ceil(dailyMission.detail[i].max);
        dailyMission.detail[i].achieve=Math.ceil(dailyMission.detail[i].achieve);
    }
    setEventAvator(dailyMission.event);
}
function resetTodayBattleData(){ //その日のバトルデータをリセットする関数
    todayBattleData=null;
    setDefault();
}

function saveData(){//データをローカルストレージへ保存する関数
    localStorage.setItem('avatorData', JSON.stringify(avatorData,undefined,1));
    localStorage.setItem('playData', JSON.stringify(playData,undefined,1));
    localStorage.setItem('battleData', JSON.stringify(battleData,undefined,1));
    localStorage.setItem('localAvator', JSON.stringify(localAvator,undefined,1));
    localStorage.setItem('todayBattleData', JSON.stringify(todayBattleData,undefined,1));
    localStorage.setItem('dailyMission', JSON.stringify(dailyMission,undefined,1));
    localStorage.setItem('battleDataSave', JSON.stringify(battleDataSave,undefined,1));
    localStorage.setItem('tempLocalAvator', JSON.stringify(tempLocalAvator,undefined,1));
    firstLaunchFlg=0;
}
function setDefault(force){ //プレイデータの変数に既定値をセットする関数 forceに1をセットすると強制でセット
    if(avatorData==null || force) {
        avatorData = [
            {name:"NAME",team:0,id:generateUuid(),star:0,item:[0,0,0,0,0],style:0,uploaded:0,typingData:{
                kpm:0,stroke:0,miss:0,play:0,
                keyData:[],missChain:0,firstSpeed:0,optData:[],kpm:0,acc:0,speedTensor:[],cong:{prob:0,key:0,count:0}},kind:0,cp:0},
            {name:"NAME",team:0,id:generateUuid(),star:0,item:[0,0,0,0,0],style:1,uploaded:0,typingData:{
                kpm:0,stroke:0,miss:0,play:0,
                keyData:[],missChain:0,firstSpeed:0,optData:[],kpm:0,acc:0,speedTensor:[],cong:{prob:0,key:0,count:0}},kind:0,cp:0}];
        for(let ii = 0;ii < 2;ii++){
            for(let i = 0;i < CLASS_KPM_RATIO.length;i++){
                avatorData[ii].typingData.speedTensor[i]=[];
                for(let j = 0;j < CLASS_KPM_RATIO.length;j++){
                    avatorData[ii].typingData.speedTensor[i][j]=[];
                    for(let k = 0;k < CLASS_KPM_RATIO.length;k++){
                        avatorData[ii].typingData.speedTensor[i][j][k] = {kpm:0,totalStroke:0};
                    }
                }
            }
            for(let i = 0;i < ALL_CHARA_SET.length+1;i++){
                avatorData[ii].typingData.keyData[i] = {acc:0,kpm:0,stability:0,totalStroke:0};
            }
            for(let i = 0;i < OPT_SET.length;i++){
                avatorData[ii].typingData.optData[i]={total:0,count:0}//最適化データ
            }    
        }
    }
    if(playData==null || force) playData = {coin:0,exp:0,level:1,settings:[0,1,0,0,0,0,0,0,0],item:[[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0]],
        itemLevel:[[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],
        itemDiscount:[[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]]};
    if (battleData==null || force) battleData = {battle:0,win:0,esc:0,stroke:0,word:0,miss:0,detail:[{battle:0,win:0},{battle:0,win:0},{battle:0,win:0}]};
    if(localAvator==null || force) {
        localAvator = [ //デフォルトアバターのデータ
            [{name:"レッドン",team:0,star:0,level:5,item:[0,1,0,0,0],style:0,cp:124,
                typingData:{kpm:0,acc:96,stroke:17,miss:1},kind:2,id:"0d2f2971-388c-438f-8110-737229e13b19"},
            {name:"ミニブルー",team:1,star:1,level:8,item:[0,2,2,0,0],style:1,cp:200,
                typingData:{kpm:0,acc:94,stroke:18,miss:1},kind:2,id:"21b964e3-e4d6-4022-9838-52d0f3a1160b"},
            {name:"イエローメイス",team:2,star:3,level:13,item:[3,3,3,0,0],style:0,cp:255,
                typingData:{kpm:0,acc:94,stroke:20,miss:1},kind:2,id:"fc119399-6762-453d-93cc-7dbb195a60ed"},
            {name:"ブンブル",team:1,star:6,level:22,item:[4,2,0,3,0],style:0,cp:308,
                typingData:{kpm:0,acc:88,stroke:16,miss:1},kind:2,id:"1f7d679b-c857-49da-ad65-4d5934f41181"},
            {name:"RED=VIII",team:0,star:9,level:28,item:[1,1,1,2,0],style:1,cp:500,
                typingData:{kpm:0,acc:96,stroke:24,miss:1},kind:2,id:"da3fceaf-a72e-4d1f-8ec8-9bee0d01e63e"},
            {name:"黄影",team:2,star:12,level:32,item:[4,4,3,4,0],style:0,cp:482,
                typingData:{kpm:0,acc:97.5,stroke:26,miss:1},kind:2,id:"a402e2b7-1575-4e8d-bf8f-85cf2b0d0fd0"}],
                [],[],[],[]];
        for(let i = 0;i < 6;i++){ //デフォルトアバターのデータを生成する
            localAvator[0][i].typingData.kpm = Math.floor(124+i*70+Math.sin(i/1.1)*20);
            localAvator[0][i].cp=localAvator[0][i].typingData.kpm;
            if(localAvator[0][i].style) {
                localAvator[0][i].typingData.kpm/=COEF_R2K;
                localAvator[0][i].typingData.kpm = Math.floor(localAvator[0][i].typingData.kpm);
            }
            localAvator[0][i].typingData.cp = localAvator[0][i].typingData.cp;
            localAvator[0][i].typingData.firstSpeed=725-i*50;
            localAvator[0][i].typingData.missChain=2+Math.sin(i*1.1)*2;
            localAvator[0][i].typingData.cong={prob:0.08-i*0.01,key:4+Math.sin(i*1.2)*2,count:1};
            localAvator[0][i].typingData.keyData=[];
            for(let j = 0;j < ALL_CHARA_SET.length+1;j++){
                localAvator[0][i].typingData.keyData[j]={acc:(95+4*Math.sin(i*1.2+j*1.3)),kpm:localAvator[0][i].typingData.kpm*(1+0.5*Math.sin(i*1.22+j*1.18)),stability:(0.5+0.5*Math.sin(i+j*1.2)),totalStroke:5};
            }
            localAvator[0][i].typingData.optData=[];
            for(let j = 0;j < OPT_SET.length;j++){
                localAvator[0][i].typingData.optData[j] = {total:100,count:Math.floor((i/5)*(i/5)*(50+50*Math.sin(i*0.5+j*0.2*j)))};
            }
            localAvator[0][i].typingData.speedTensor=[];
            for(let j = 0;j < CLASS_KPM_RATIO.length;j++){
                localAvator[0][i].typingData.speedTensor[j]=[];
                for(let k = 0;k < CLASS_KPM_RATIO.length;k++){
                    localAvator[0][i].typingData.speedTensor[j][k]=[];
                    for(let l = 0;l < CLASS_KPM_RATIO.length;l++){
                        localAvator[0][i].typingData.speedTensor[j][k][l] = {kpm:(1+0.5*Math.sin(j*0.7+k*0.8+l*0.9))*localAvator[0][i].typingData.kpm,totalStroke:1};
                    } 
                }  
            }
        }
    }
    if(todayBattleData==null || force) todayBattleData = {battle:0,win:0,esc:0,stroke:0,miss:0,word:0,detail:[{battle:0,win:0},{battle:0,win:0},{battle:0,win:0}]};
    if(dailyMission==null || force) {
        dailyMission = {date:null,battle:0,win:0,totalStroke:0,word:0,event:0,detail:[{type:0,require:0,team:0,max:0,progress:0,achieve:0},{type:0,require:0,team:0,max:0,progress:0,achieve:0},{type:0,require:0,team:0,max:0,progress:0,achieve:0}]};
//        setDailyMission();
    }
    if(battleDataSave==null || force) battleDataSave =[];
    if(tempLocalAvator==null || force) tempLocalAvator =[];
}
function processAddFunction(){
    //後から追加した機能のエラーを防ぐ関数
    if(playData.itemLevel==undefined){
        playData.itemLevel=[];
        for(let i = 0;i < 5;i++){
            playData.itemLevel[i] = [0,0,0,0,0,0,0,0,0,0];
        }
    }
    if(playData.itemDiscount==undefined){//割引
        playData.itemDiscount=[];
        for(let i = 0;i < 5;i++){
            playData.itemDiscount[i] = [0,0,0,0,0,0,0,0,0,0];
        }
    }
    if(avatorData[0].uploaded==undefined) avatorData[0].uploaded=0;//アップロード済みか？
    if(avatorData[1].uploaded==undefined) avatorData[1].uploaded=0;
}
function loadData(){//データをローカルストレージから読み込む関数
    avatorData = JSON.parse(localStorage.getItem('avatorData'));
    playData = JSON.parse(localStorage.getItem('playData'));
    battleData = JSON.parse(localStorage.getItem('battleData'));
    localAvator = JSON.parse(localStorage.getItem('localAvator'));
    todayBattleData = JSON.parse(localStorage.getItem('todayBattleData'));
    dailyMission = JSON.parse(localStorage.getItem('dailyMission'));
    battleDataSave=JSON.parse(localStorage.getItem('battleDataSave'));
    tempLocalAvator=JSON.parse(localStorage.getItem('tempLocalAvator'));
    processAddFunction();
    setDefault();
}
function resetData(){//データをリセットし、変数に既定値をセットする関数
    localStorage.clear();
    setDefault(1);
    firstLaunchFlg=1;
}
function setAvatorData(dir){//アバターデータをセットする dir:0なら0から1へ、dir:1なら1から0へ
    avatorData[1-dir].name=avatorData[dir].name;
    avatorData[1-dir].team=avatorData[dir].team;
    avatorData[1-dir].star=avatorData[dir].star;
    for(var i = 0;i < avatorData[dir].item.length;i++){
        avatorData[1-dir].item[i]=avatorData[dir].item[i];
    }
}
function updateTypingData(style,myTypingData){//avatorDataのタイピングデータを更新する関数
    if(!myTypingData.totalStroke) return 0;//一打も打たずに終了していた場合は学習しない
    avatorData[style].typingData.kpm = Number((avatorData[style].typingData.kpm * avatorData[style].typingData.stroke  + myTypingData.kpm * myTypingData.totalStroke)/(avatorData[style].typingData.stroke+myTypingData.totalStroke)).toFixed(1);
    avatorData[style].typingData.acc = Number((avatorData[style].typingData.acc * avatorData[style].typingData.stroke  + myTypingData.acc * myTypingData.totalStroke)/(avatorData[style].typingData.stroke+myTypingData.totalStroke)).toFixed(1);
    avatorData[style].typingData.missChain=(avatorData[style].typingData.missChain* avatorData[style].typingData.play + myTypingData.missChain)/ (avatorData[style].typingData.play+1);
    avatorData[style].typingData.firstSpeed=(avatorData[style].typingData.firstSpeed* avatorData[style].typingData.play + myTypingData.firstSpeed)/ (avatorData[style].typingData.play+1);
    avatorData[style].typingData.cong.prob=(avatorData[style].typingData.cong.prob* avatorData[style].typingData.play + myTypingData.cong.prob)/ ( avatorData[style].typingData.play+1);
    if((avatorData[style].typingData.cong.count+myTypingData.cong.count)) avatorData[style].typingData.cong.key=(avatorData[style].typingData.cong.key* avatorData[style].typingData.cong.count + myTypingData.cong.key*myTypingData.cong.count)/ (avatorData[style].typingData.cong.count+myTypingData.cong.count);
    avatorData[style].typingData.cong.count+=avatorData[style].typingData.cong.count;
    avatorData[style].typingData.play++;
    for(let i = 0;i < avatorData[style].typingData.keyData.length;i++){
        if(avatorData[style].typingData.keyData[i].totalStroke+myTypingData.keyData[i].totalStroke){
            avatorData[style].typingData.keyData[i].acc = (avatorData[style].typingData.keyData[i].acc *avatorData[style].typingData.keyData[i].totalStroke +myTypingData.keyData[i].acc *myTypingData.keyData[i].totalStroke)/(avatorData[style].typingData.keyData[i].totalStroke+myTypingData.keyData[i].totalStroke); 
            avatorData[style].typingData.keyData[i].kpm = (avatorData[style].typingData.keyData[i].kpm *avatorData[style].typingData.keyData[i].totalStroke +myTypingData.keyData[i].kpm *myTypingData.keyData[i].totalStroke)/(avatorData[style].typingData.keyData[i].totalStroke+myTypingData.keyData[i].totalStroke); 
            avatorData[style].typingData.keyData[i].stability = (avatorData[style].typingData.keyData[i].stability *avatorData[style].typingData.keyData[i].totalStroke +myTypingData.keyData[i].stability *myTypingData.keyData[i].totalStroke)/(avatorData[style].typingData.keyData[i].totalStroke+myTypingData.keyData[i].totalStroke); 
            avatorData[style].typingData.keyData[i].totalStroke+=myTypingData.keyData[i].totalStroke;    
        } else {//初回プレイで0打鍵だった場合、平均値を入れておく
            avatorData[style].typingData.keyData[i].acc = Number(avatorData[style].typingData.acc);
            avatorData[style].typingData.keyData[i].kpm = Number(avatorData[style].typingData.kpm);
            avatorData[style].typingData.keyData[i].stability = 0;
        }
    }
    for(let i = 0;i < avatorData[style].typingData.optData.length;i++){
        avatorData[style].typingData.optData[i].total+=myTypingData.optData[i].total;
        avatorData[style].typingData.optData[i].count+=myTypingData.optData[i].count;
    }
    for(let i = 0;i < CLASS_KPM_RATIO.length;i++){
        for(let j = 0;j < CLASS_KPM_RATIO.length;j++){
            for(let k = 0;k < CLASS_KPM_RATIO.length;k++){
                if(avatorData[style].typingData.speedTensor[i][j][k].totalStroke+myTypingData.speedTensor[i][j][k].totalStroke){
                    avatorData[style].typingData.speedTensor[i][j][k].kpm=
                        (avatorData[style].typingData.speedTensor[i][j][k].kpm*avatorData[style].typingData.speedTensor[i][j][k].totalStroke+
                        myTypingData.speedTensor[i][j][k].kpm*myTypingData.speedTensor[i][j][k].totalStroke)
                        /(avatorData[style].typingData.speedTensor[i][j][k].totalStroke+myTypingData.speedTensor[i][j][k].totalStroke);
                    avatorData[style].typingData.speedTensor[i][j][k].totalStroke+=myTypingData.speedTensor[i][j][k].totalStroke;
                } else{
                    avatorData[style].typingData.speedTensor[i][j][k].kpm=Number(avatorData[style].typingData.kpm);
                }
            } 
        }
    }
}
function generateUuid() {//UUIDを生成する
    let chars = "aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "a":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "b":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}
function setLADBattleSaveData(){
    for(let i = 0;i < 5;i++){///getBattleDataSaveから戦績を取得する
        for(let j = 0;j < localAvator[i].length;j++){
            localAvator[i][j].win=getBattleDataSave(localAvator[i][j].id).win;
            localAvator[i][j].battle=getBattleDataSave(localAvator[i][j].id).battle;
            localAvator[i][j].pWin=getBattleDataSave(localAvator[i][j].id).pWin;
            localAvator[i][j].kWin=getBattleDataSave(localAvator[i][j].id).kWin;
        }
    }
}
function getBattleDataSave(myId){
    //battleDataSaveから情報を得る
    for(let i = 0;i < battleDataSave.length;i++){
        if(battleDataSave[i].id == myId) return battleDataSave[i];
    }
    return {win:0,battle:0,pWin:0,kWin:0,isUnknown:1,date:"0000000000"};
}
function getLocalAvator(myId){
    //localAvatorDataから情報を得る
    for(let i = 0;i <5;i++){
        for(let j = 0;j < localAvator[i].length;j++){
            if(localAvator[i][j].id == myId) return localAvator[i][j];
        }
    }
    return {isUnknown:1};
}
function setBattleDataSave(myId,myBattleResult){
    //battleDataSaveに情報をセットする
    for(let i = 0;i < battleDataSave.length;i++){
        if(battleDataSave[i].id == myId){
            battleDataSave[i].battle++;
            battleDataSave[i].win+=myBattleResult.win;
            battleDataSave[i].kWin+=myBattleResult.kWin;
            battleDataSave[i].pWin+=myBattleResult.pWin;
            return 0;
        }
    }
    //見つからなかったら
    battleDataSave.push({id:myId,battle:1,win:myBattleResult.win,kWin:myBattleResult.kWin,pWin:myBattleResult.pWin,date:"00000000"});
    return 1;
}
function setRankToLocalAvator(){
    //CP順に並び替え
    tempLocalAvator.sort((a,b)=>-Number(a.cp)+Number(b.cp));
    let tempRankGen=1,tempRankK=1,tempRankR=1;
    for(let i = 0;i < tempLocalAvator.length;i++){
        tempLocalAvator[i].rankGen=-1;
        tempLocalAvator[i].rankK=-1;
        tempLocalAvator[i].rankR=-1;
        tempLocalAvator[i].rankGen=tempRankGen,tempRankGen++;
        if(tempLocalAvator[i].style == 0) tempLocalAvator[i].rankR=tempRankR,tempRankR++;
        if(tempLocalAvator[i].style == 1) tempLocalAvator[i].rankK=tempRankK,tempRankK++;
    }
}
function setNCMBEnemyAvator(force){
    let ncmb = new NCMB(
        "a547f609bad881bc03104d7b2f8f6359a4bce06cdf283092bdb996d2dd698ed1",
        "75167c4e0d9e9a7297d32d2b3db43aaed2683d84f5c5498c78e64c2584008c4f");
    //オンラインのアバターデータをセットする関数
    let myDate = new Date();
    let lastFetchDate = 
        myDate.getFullYear() + "/" +
        ('00' + (Number(myDate.getMonth())+1)).slice(-2) +  "/" + 
        ('00'  + myDate.getDate()).slice(-2) + " "  + 
        ('00' + myDate.getHours()).slice(-2) +  ":" + 
        ('00' + myDate.getMinutes()).slice(-2);
    dataFetchStatus=0;
    let lastFetchDateRaw=myDate.getFullYear() +
        ('00' + (Number(myDate.getMonth())+1)).slice(-2) +
        ('00'  + myDate.getDate()).slice(-2) + 
        ('00' + myDate.getHours()).slice(-2);
    if(playData.lastFetchDateRaw == lastFetchDateRaw && !DEBUG_MODE && force!=1){
        dataFetchStatus=1;
        return 0;//一時間以内の更新は行わない
    }     
    tempLocalAvator=[];
    //ここからNCMBとの通信を行うデータの書き込み処理
    let avators = ncmb.DataStore("Avators");
    avators.limit(FETCH_NUM).fetchAll().then(function(avators){
        tempLocalAvator=avators;
        for(let i = 0;i < tempLocalAvator.length;i++){
            tempLocalAvator[i] = JSON.parse(tempLocalAvator[i].avatorData);
            let tempClass = 1;
            if(tempLocalAvator[i].cp-avatorData[playData.settings[0]].cp > 50) tempClass=0;//格上
            if(tempLocalAvator[i].cp-avatorData[playData.settings[0]].cp < -50) tempClass=2;//格下
            let tempTeamCoef = 1;
            if(((3+avatorData[0].team-tempLocalAvator[i].team) % 3) == 1) tempTeamCoef=0.95;
            if(((3+avatorData[0].team-tempLocalAvator[i].team) % 3) == 2) tempTeamCoef=1.2;
            tempLocalAvator[i].recommendation = (0.5 + Math.pow(Math.abs(avatorData[playData.settings[0]].cp - tempLocalAvator[i].cp)+1,-0.5));//ここからおすすめ度をセットする処理を追加
            //tempLocalAvator[i].recommendation*=(10 + battleData.detail[tempClass].battle) / (10+battleData.detail[0].battle+battleData.detail[1].battle+battleData.detail[2].battle);
            tempLocalAvator[i].recommendation*=tempTeamCoef;
            if(isMyId(tempLocalAvator[i].id)) tempLocalAvator[i].recommendation*=0.6;
        }
        dataFetchStatus=1;
        setRankToLocalAvator();//ランクをセットする
        setShowLocalAvator(0);//表示を既定値でセットする
        setOrderButton();
        saveData();//取得後にセーブする
        playData.lastFetchDate=lastFetchDate;//最終データ取得時間を更新
        playData.lastFetchDateRaw=lastFetchDateRaw;
    })
    .catch(function(error){//取得失敗
        dataFetchStatus=2;
        setShowLocalAvator(0);//表示を既定値でセットする
        setOrderButton();
        console.log(error);
    });
}
function uploadNCMBAvatorData(myAvatorData){//アバターをアップロード
    let ncmb = new NCMB(
        "a547f609bad881bc03104d7b2f8f6359a4bce06cdf283092bdb996d2dd698ed1",
        "75167c4e0d9e9a7297d32d2b3db43aaed2683d84f5c5498c78e64c2584008c4f");
    let Item = ncmb.DataStore("Avators");
    let item = new Item();
    myAvatorData.style=createAvatorStyle;//スタイルを修正
    myAvatorData.level = playData.level;
    let myDate = new Date();
    let myY = ('0000' +  myDate.getFullYear()).slice(-4);
    let myM = ('00' + myDate.getMonth()).slice(-2);
    let myD = ('00' + myDate.getDate()).slice(-2);
    let myH = ('00' +  myDate.getHours()).slice(-2);
    myAvatorData.date = myY+ myM + myD +myH;
    dataSaveStatus=0;
    item.set("avatorData",JSON.stringify(myAvatorData,undefined,1))
    .set("avatorID",myAvatorData.id)
    .save()
    .then(function(item){
        let avaCheck=JSON.stringify(myAvatorData,undefined,1);
        avaCheck=JSON.parse(avaCheck);//パース時のエラーを防ぐ
        dataSaveStatus=1;
        if(avatorData[createAvatorStyle].uploaded==0){
            playData.coin+=50;
            avatorData[createAvatorStyle].uploaded=1;//アップロード済みにする
            msgBox.push({
                text:"アバターのアップロードに成功しました！　コイン50ゴールド獲得！",
                ani:t,
                btns1:{text:"OK",onClick:function(){
                    dataFetchStatus=0;
                    setNCMBEnemyAvator(1);
                }}});    
        } else{
            msgBox.push({
                text:"アバターのアップロードに成功しました！",
                ani:t,
                btns1:{text:"OK",onClick:function(){
                    dataFetchStatus=0;
                    setNCMBEnemyAvator(1);
                }}});    
        }
        saveData();//データをセーブ
    })
    .catch(function(error){//アップロード失敗
        dataSaveStatus=2;
        msgBox.push({
            text:"アバターのアップロードに失敗しました。インターネット接続を確認してください。",
            ani:t,
            btns1:{text:"OK",onClick:function(){}}});
    });
}
function updateNCMBAvatorData(oldID,myAvatorData){//アバターをアップロード
    let ncmb = new NCMB(
        "a547f609bad881bc03104d7b2f8f6359a4bce06cdf283092bdb996d2dd698ed1",
        "75167c4e0d9e9a7297d32d2b3db43aaed2683d84f5c5498c78e64c2584008c4f");
    let Item = ncmb.DataStore("Avators");
    
    let item = new Item();
    myAvatorData.style=createAvatorStyle;//スタイルを修正
    myAvatorData.level = playData.level;
    let myDate = new Date();
    let myY = ('0000' +  myDate.getFullYear()).slice(-4);
    let myM = ('00' + myDate.getMonth()).slice(-2);
    let myD = ('00' + myDate.getDate()).slice(-2);
    let myH = ('00' +  myDate.getHours()).slice(-2);
    myAvatorData.date = myY+ myM + myD +myH;
    dataSaveStatus=0;
    Item.equalTo("avatorID",oldID).limit(FETCH_NUM).fetchAll()
    .then(function(result){
        var promises = [result[0].delete()];
        return Promise.all(promises);
    })
    .then(function(result){
        let avaCheck=JSON.stringify(myAvatorData,undefined,1);
        avaCheck=JSON.parse(avaCheck);//パース時のエラーを防ぐ
        item.set("avatorData",JSON.stringify(myAvatorData,undefined,1))
        .set("avatorID",myAvatorData.id)
        .save()
        .then(function(item){
            dataSaveStatus=1;
            msgBox.push({
                text:"アバターの更新に成功しました！",
                ani:t,
                btns1:{text:"OK",onClick:function(){
                    dataFetchStatus=0;
                    setNCMBEnemyAvator(1);
                }}});
        })
    })
    .catch(function(error){
        dataSaveStatus=1;
        msgBox.push({
            text:"アバターの更新に失敗しました。インターネット接続を確認してください。",
            ani:t,
            btns1:{text:"OK",onClick:function(){}}});
    })

}function deleteNCMBAvator(deleteId){
    //deleteIDのNCMBデータを削除する
    let ncmb = new NCMB(
        "a547f609bad881bc03104d7b2f8f6359a4bce06cdf283092bdb996d2dd698ed1",
        "75167c4e0d9e9a7297d32d2b3db43aaed2683d84f5c5498c78e64c2584008c4f");
    let Item = ncmb.DataStore("Avators");
    msgBox.push({
        text:"アップロード済みのアバターデータを削除しますか？　既に保存したユーザーにはアバターデータが残り続けます。",
        ani:t,
        btns1:{text:"YES",onClick:function(){
            dataFetchStatus=0;
            Item.equalTo("avatorID",deleteId).limit(FETCH_NUM).fetchAll()
            .then(function(result){
                var promises = [result[0].delete()];
                return Promise.all(promises);
            })
            .then(function(result){
                dataFetchStatus=0;
                setNCMBEnemyAvator(1);
                msgBox.push({
                    text:"アバターの削除に成功しました。アバターデータはいつでも再アップロード可能です。",
                    ani:t,
                    btns1:{text:"OK",onClick:function(){}}});
            })
            .catch(function(error){
                dataFetchStatus=1;
                msgBox.push({
                    text:"アバターの削除に失敗しました。インターネット接続を確認してください。",
                    ani:t,
                    btns1:{text:"OK",onClick:function(){}}});
            });
        }},
        btns2:{text:"NO",onClick:function(){}}
    });

}
function setShowLocalAvator(order,col,style){
    if(order==undefined) order=onlineAvatorOrder;
    if(col== undefined) col = onlineAvatorCol;
    if(style==undefined) style=onlineAvatorStyle;
    showEnemyAvator=[];//リセット
    for(let i  = 0;i < tempLocalAvator.length;i++){
        //条件に合致するならセット
        if(col[tempLocalAvator[i].team] && style[tempLocalAvator[i].style]){
            showEnemyAvator.push(tempLocalAvator[i]);
        }
    }
    //並び替えの処理をここに追加
    if(order==0){//おすすめ順
        showEnemyAvator.sort((a,b)=>-Number(a.recommendation)+Number(b.recommendation));
    } else if(order==1){//新着順
        showEnemyAvator.sort((a,b)=>-Number(a.date)+Number(b.date));
    } else if(order==2){//cp順
        showEnemyAvator.sort((a,b)=>-Number(a.cp)+Number(b.cp));
    } else if(order == 3){//レベル順
        showEnemyAvator.sort((a,b)=>-Number(a.level)+Number(b.level));
    }
    onlineShowPage=0;
}
function setOrderButton(){
    for(let i = 0;i < prls.length;i++){
        if(prls[i].id >=0 && prls[i].id <= 3){//順番のボタンなら
            if(prls[i].id == onlineAvatorOrder){
                prls[i].colSet=3;
                prls[i].hoverColSet=4;
                prls[i].sound="cursor";
            } else{
                prls[i].colSet=0;
                prls[i].hoverColSet=1;
                prls[i].sound="cursor";
            }
        }else if(prls[i].id == 9){//アバター作成ボタンなら
            if(getAvailableCreateAvator()==1){//新規作成可能時
                prls[i].colSet=3;
                prls[i].hoverColSet=4;
                prls[i].text="アバターを作成！";
                prls[i].sound="enter";
            } else if(getAvailableCreateAvator()==2){//更新可能時
                prls[i].colSet=3;
                prls[i].hoverColSet=4;
                prls[i].text="アバターを更新！";
                prls[i].sound="enter";
            } else if(getAvailableCreateAvator()==3){//更新不可能時
                prls[i].colSet=13;
                prls[i].hoverColSet=13;
                prls[i].text="アバターを更新！";
                prls[i].sound="error";
            } else {//作成不可能時
                prls[i].colSet=13;
                prls[i].hoverColSet=13;
                prls[i].text="アバターを作成！";
                prls[i].sound="error";
            }
        }else if(prls[i].id>=10 && prls[i].id<=11){//入力方式のボタンなら
            if(onlineAvatorStyle[prls[i].id-10]){
                prls[i].colSet=prls[i].id+7;
                prls[i].hoverColSet=prls[i].id+7;
            } else{
                prls[i].colSet=13;
                prls[i].hoverColSet=13;
            }
            prls[i].sound="cursor";
        } else if(prls[i].id>=20 && prls[i].id<=22){//入力方式のボタンなら
            if(onlineAvatorCol[prls[i].id-20]){
                prls[i].colSet=5+(prls[i].id-20)*2;
                prls[i].hoverColSet=5+(prls[i].id-20)*2+1;
            } else{
                prls[i].colSet=13;
                prls[i].hoverColSet=13;
            }
            prls[i].sound="cursor";
        }else if(prls[i].id>=30 && prls[i].id<=33){//ダウンロードボタンなら
            if(showEnemyAvator.length > prls[i].id-30+4*onlineShowPage){
                if(!getLocalAvator(showEnemyAvator[prls[i].id-30+4*onlineShowPage].id).isUnknown && 
                    getLocalAvator(showEnemyAvator[prls[i].id-30+4*onlineShowPage].id).date != showEnemyAvator[prls[i].id-30+4*onlineShowPage].date){
                    prls[i].colSet=3;//未保存で保存可能
                    prls[i].hoverColSet=4;
                    prls[i].text=ONLINE_AVATOR_STATUS[0];
                    prls[i].sound="decide";
                } else if(isMyId(showEnemyAvator[prls[i].id-30+4*onlineShowPage].id)){
                    prls[i].colSet=1;//自分のアバター
                    prls[i].hoverColSet=2;
                    prls[i].text=ONLINE_AVATOR_STATUS[1];
                    prls[i].sound="decide";
                } else if(!getLocalAvator(showEnemyAvator[prls[i].id-30+4*onlineShowPage].id).isUnknown && 
                    getLocalAvator(showEnemyAvator[prls[i].id-30+4*onlineShowPage].id).date == showEnemyAvator[prls[i].id-30+4*onlineShowPage].date) {//更新
                    prls[i].colSet=13;//保存済みだが更新なし
                    prls[i].hoverColSet=13;
                    prls[i].text=ONLINE_AVATOR_STATUS[3];
                    prls[i].sound="error";
                } else {//保存済みで更新可能
                    prls[i].colSet=3;
                    prls[i].hoverColSet=4;
                    prls[i].text=ONLINE_AVATOR_STATUS[2];
                    prls[i].sound="decide";
                }
            } else{//保存できないとき
                prls[i].colSet=13;
                prls[i].hoverColSet=13;
                prls[i].text=ONLINE_AVATOR_STATUS[3];
            }
        }
    }
}
function analyzeEnemyTypeData(myEnemyTypeData){
    let sum=0;
    for(let i = 0;i < myEnemyTypeData.length;i++){
        sum+=60000*myEnemyTypeData[i].length/myEnemyTypeData[i][myEnemyTypeData[i].length-1].time;
    }
    return sum/30;
}
function analyzeTypeData(typeData){
    let sum=0;
    for(let i = 0;i < CLASS_KPM_RATIO.length;i++){
        for(let j = 0;j < CLASS_KPM_RATIO.length;j++){
            for(let k = 0;k < CLASS_KPM_RATIO.length;k++){
                sum+=typeData.speedTensor[i][j][k].kpm;
            }       
        }    
    }
    console.log(sum/Math.pow(CLASS_KPM_RATIO.length,3))
}
function getAvailableCreateAvator(){
//アバター作成ステータスを返す　作成可能なら１，更新可能なら２，更新不可能なら３，作成不可能なら４ 読込中なら5
    if(dataFetchStatus == 0 || dataSaveStatus==0) return 5;
    for(let i = 0;i < tempLocalAvator.length;i++){
        if(tempLocalAvator[i].id == avatorData[createAvatorStyle].id){
            //作成済みだったら
            let myDate = new Date();//日付をチェック
            let myY = ('0000' +  myDate.getFullYear()).slice(-4);
            let myM = ('00' + myDate.getMonth()).slice(-2);
            let myD = ('00' + myDate.getDate()).slice(-2);
            let myH = ('00' +  myDate.getHours()).slice(-2);
            let nowDate = myY+ myM + myD +myH;
            if(nowDate != tempLocalAvator[i].date){
                if(tempLocalAvator[i].typingData.stroke == avatorData[createAvatorStyle].typingData.stroke) return 3;
                return 2;
            } else{
                return 3;
            }
        }
    }
    if(avatorData[createAvatorStyle].typingData.stroke >= 10000){
        return 1;
    } else{
        return 4;
    }
}
function isMyId(idChecked){
    if(idChecked == avatorData[0].id) return 1;
    if(idChecked==avatorData[1].id) return 2;
    return 0;
}
function getPrlsText(id){
    for(let i = 0;i < prls.length;i++){
        if(prls[i].id == id) return prls[i].text;
    }
}
function getlocalStorageString(){
    //ローカルストレージのデータを保存する文字列を返す
    let playDataS=JSON.stringify(playData,undefined,1);
    let battleDataS=JSON.stringify(battleData,undefined,1);
    let localAvatorS=JSON.stringify(localAvator,undefined,1);
    let todayBattleDataS=JSON.stringify(todayBattleData,undefined,1);
    let dailyMissionS=JSON.stringify(dailyMission,undefined,1);
    let avatorDataS=JSON.stringify(avatorData,undefined,1);
    let battleDataSaveS=JSON.stringify(battleDataSave,undefined,1);
    let tempLocalAvatorS=JSON.stringify(tempLocalAvator,undefined,1);
    return (
        playDataS+"$"+battleDataS+"$"+
        localAvatorS+"$"+todayBattleDataS+"$"+
        dailyMissionS+"$"+avatorDataS+"$"+
        battleDataSaveS+"$"+tempLocalAvatorS);
}
function setlocalStorageString(txt){
    let txtLine=txt.split("$");
    try {
        playData = JSON.parse(txtLine[0])
        battleData = JSON.parse(txtLine[1])
        localAvator = JSON.parse(txtLine[2])
        todayBattleData = JSON.parse(txtLine[3])
        dailyMission = JSON.parse(txtLine[4])
        avatorData = JSON.parse(txtLine[5])
        battleDataSave = JSON.parse(txtLine[6])
        tempLocalAvator = JSON.parse(txtLine[7])
        saveData();
    } catch(err){
        return -1;
    }
    return 0;
}