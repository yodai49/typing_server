//タイピングの分析を行うモジュール
/*

| analyzeTyping(style,typingData);
|    //タイピングの分析を行った構造体を返却する関数
|    // style:　入力方式 0ならローマ字、1ならカナ　指定なしでローマ字
|    // typingData: タイピングデータを表す構造体　[{time:152, key:"a", shiftKey:0, isMiss:0, isFirst: 0},{...}]
|    // (return): タイピングデータの分析結果を表す構造体　{kpm: ,acc:, }
*/
const CLASS_KPM_RATIO=[0.5,0.75,1,1.25,1.5,2,99999];

const OPT_SET=[
    ["sya","sha"],["syu","shu"],["syo","sho"],
    ["tya","cha"],["tyu","chu"],["tyo","cho"],
    ["tya","cya"],["tyu","cyu"],["tyo","cyo"],
    ["nn","xn"],
    ["ka","ca"],["si","ci"],["ku","cu"],["se","ce"],["ko","co"],
    ["la","xa"],["li","xi"],["lu","xu"],["le","xe"],["lo","xo"],
    ["zya","ja"],["zi","ji"],["zyu","ju"],["zye","je"],["zyo","jo"],
    ["hu","fu","cs"],["ti","chi"],["si","shi"]]

function getPartialKpm(myTypingData,begin,end){//beginからendまでのkpmを計測　初速は省いて処理
    let tempCount=0,tempKpm=-1;
    for(let i = 0;i < end-begin;i++){
//        console.log(begin+i+1,myTypingData.length);
        if(!myTypingData[begin+i].isFirst){
            let nowKpm=60000/(myTypingData[begin+i+1].time-myTypingData[begin+i].time);
            tempKpm=(tempKpm*tempCount+nowKpm)/(1+tempCount);
            tempCount++;
        }
    }
    return tempKpm;
}
function analyzeTyping(style,typingData){
    //タイピングの分析を行った構造体を返却する関数
    // style:　入力方式 0ならローマ字、1ならカナ　指定なしでローマ字
    // typingData: タイピングデータを表す構造体　[{time:152, key:"a", shiftKey:0, isMiss:0, isFirst: 0},{...}]
    // (return): タイピングデータの分析結果を表す構造体　{kpm: ,acc:, }
    let miss=0;//ミス数
    let stroke=0;//ミスも含めた打鍵数
    let tempCorrectTime=0;//直前の正解の時間
    let keyData=[];
    let firstSpeed=0;
    let wordCount=0;
    let missChain=0;
    let lastMissCount=0;//何文字連続でミスしたか？
    let firstMissCount=0;//何回ミスしたか？
    let cong={prob:0,key:0,count:0};//何回つまったか？
    let lastCongCount=0;
    let optData=[];
    let speedTensor=[];
    let wholeString="";
    let baseKpm=60000*typingData.length / typingData[typingData.length-1].time;//ベースとなるKPM
    for(let i = 0;i < CLASS_KPM_RATIO.length;i++){
        speedTensor[i]=[];
        for(let j = 0;j < CLASS_KPM_RATIO.length;j++){
            speedTensor[i][j]=[];
            for(let k = 0;k < CLASS_KPM_RATIO.length;k++){
                speedTensor[i][j][k] = {kpm:0,totalStroke:0};
            }
        }
    }
    for(let i = 0;i < ALL_CHARA_SET.length+1;i++){
        keyData[i] = {acc:0,kpm:0,stability:0,totalStroke:0};
    }
    for(let i = 0;i < OPT_SET.length;i++){
        optData[i]={total:0,count:0}//最適化データ
    }
    for(let i = 0;i < typingData.length-1;i++){
        if(typingData[i].time == typingData[i+1].time) typingData[i+1].time++;//全く同じ時間で打っていたらずらす（エラー防止）
    }
    for(let i = 0;i < typingData.length;i++){
        if(typingData[i].isMiss){
            miss++;
            lastMissCount++;
            lastCongCount=0;
        } else if(lastMissCount){//ミスからの復活
            missChain=(missChain*firstMissCount+lastMissCount)/(firstMissCount+1);
            lastMissCount=0;
            firstMissCount++;
        }
        if(!typingData[i].isMiss){//ミスではない時
            if(!typingData[i].isFirst){//1文字目ではなかったら、データの分析に加算
                let charKpm= Math.max(
                    60000/(typingData[i].time-tempCorrectTime),
                    baseKpm/5);//その文字のkpm 全体の5分の1以下は外れ値として処理
                let charStab=Math.min(Math.pow(baseKpm,2),Math.pow(charKpm-baseKpm,2))/Math.pow(baseKpm,2);//乱れ度合い　baseKpmの2倍の二乗まで
                keyData[getAllCharaSetNum(typingData[i].key)].kpm=(keyData[getAllCharaSetNum(typingData[i].key)].kpm*keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+charKpm)/(keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+1);
                keyData[getAllCharaSetNum(typingData[i].key)].stability=(keyData[getAllCharaSetNum(typingData[i].key)].stability*keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+charStab)/(keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+1);
                if(lastMissCount){//その文字の直前でミスがあったら
                    keyData[getAllCharaSetNum(typingData[i].key)].acc=(keyData[getAllCharaSetNum(typingData[i].key)].acc*keyData[getAllCharaSetNum(typingData[i].key)].totalStroke)/(keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+1);
                } else{
                    keyData[getAllCharaSetNum(typingData[i].key)].acc=(keyData[getAllCharaSetNum(typingData[i].key)].acc*keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+100)/(keyData[getAllCharaSetNum(typingData[i].key)].totalStroke+1);
                }
                keyData[getAllCharaSetNum(typingData[i].key)].totalStroke++;
                if(charKpm<baseKpm/2.5){//詰まっている場合
                    lastCongCount++;
                } else if(lastCongCount){//つまりからの復活
                    cong.key=(cong.key*cong.count+lastCongCount)/(cong.count+1);
                    cong.count++;
                    lastCongCount=0;
                }
                if(i>=10){//10文字目以降、スピードテンソルの処理
                    let kpmRatio369=[
                        getPartialKpm(typingData,i-4,i-1)/baseKpm,
                        getPartialKpm(typingData,i-7,i-1)/baseKpm,
                        getPartialKpm(typingData,i-10,i-1)/baseKpm];
                    let class369=[CLASS_KPM_RATIO.length-1,CLASS_KPM_RATIO.length-1,CLASS_KPM_RATIO.length-1];
                    for(let i = 0;i < 3;i++){
                        for(let j = 0;j<CLASS_KPM_RATIO.length;j++){
                            if(kpmRatio369[i] < CLASS_KPM_RATIO[j]) {
                                class369[i] = j;
                                break;
                            }
                        }
                    }
                    speedTensor[class369[0]][class369[1]][class369[2]].kpm=(speedTensor[class369[0]][class369[1]][class369[2]].kpm*speedTensor[class369[0]][class369[1]][class369[2]].totalStroke+charKpm)/(1+speedTensor[class369[0]][class369[1]][class369[2]].totalStroke);
                    speedTensor[class369[0]][class369[1]][class369[2]].totalStroke++;
                }
            } else{//1文字目だったら初速に加算
                let myFirstSpeed=0;
                if(i==0){
                    myFirstSpeed=(typingData[i].time);
                } else{
                    myFirstSpeed=(typingData[i].time-typingData[i-1].time);
                }
                myFirstSpeed=Math.min(800,myFirstSpeed);//800を超える場合は外れ値として扱う
                firstSpeed=(firstSpeed*wordCount+myFirstSpeed)/(wordCount+1);
                wordCount++;
            }
            tempCorrectTime=typingData[i].time;
        }
        tempTime=typingData[i].time;
        stroke++;
        wholeString+=typingData[i].key;
    }
    if(style==0){//最適化データの処理
        for(let i = 0;i < OPT_SET.length;i++){
            optData[i].total= (wholeString.match( new RegExp(OPT_SET[i][0],"g")) || [] ).length+(wholeString.match( new RegExp(OPT_SET[i][1],"g")) || [] ).length;
            optData[i].count= ( wholeString.match( new RegExp(OPT_SET[i][1],"g")) || [] ).length;    
            optData[i].prob= optData[i].count/optData[i].total;
            if(isNaN(optData[i].prob)) optData[i].prob=0;
        }
    }
    cong.prob=cong.count/(stroke-miss);//詰まる確率をセット
    return {
        kpm:(stroke-miss)/tempTime*60000,
        acc:Number((stroke-miss)/stroke*100).toFixed(1),
        totalStroke:stroke-miss,
        firstSpeed:firstSpeed,
        wordCount:wordCount,
        keyData:keyData,
        missChain:missChain,
        firstMissCount:firstMissCount,
        cong:cong,
        optData:optData,
        speedTensor:speedTensor
        };
}
