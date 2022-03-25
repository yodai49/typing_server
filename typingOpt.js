//最適化の処理を行うモジュール
/*

| getRome(s)
|    //ひらがなから標準的な打鍵ローマ字を返却する関数
|    // s:　ローマ字を取得する単語　ひらがな
|    // (return): sの標準的な打鍵ローマ字

| checkOpt(targetStr,typingStr,typistMode)
|    // 入力が受理可能かどうかを判断する関数
|    // typingStrの最後の文字が受理可能化どうかを判定する
|    // targetStr 標準的な打鍵ローマ字
|    // typingStr 打鍵されたローマ字
|    // typistMode 非効率な最適化を弾くかどうか　1なら非効率なものは受理しない　指定なしなら0
|    // (return): 1-最適化可能(受理可能)　0-最適化不可能(受理不可能)

*/

const CHARA_SET=[
    "あ","い","う","え","お",
    "か","き","く","け","こ",
    "さ","し","す","せ","そ",
    "た","ち","つ","て","と",
    "な","に","ぬ","ね","の",
    "は","ひ","ふ","へ","ほ",
    "ま","み","む","め","も",
    "や","ー","ゆ","-","よ",
    "ら","り","る","れ","ろ",
    "わ","を","ん","-","-",    
    "が","ぎ","ぐ","げ","ご",
    "ざ","じ","ず","ぜ","ぞ",
    "だ","ぢ","づ","で","ど",
    "ば","び","ぶ","べ","ぼ",
    "ぱ","ぴ","ぷ","ぺ","ぽ",
    "ゃ","ゅ","ょ","っ","ー",
    "ぁ","ぃ","ぅ","ぇ","ぉ"
]
const ALL_CHARA_SET=[//すべての文字セット　タイピングデータはこの順で格納
    "a","b","c","d","e",
    "f","g","h","i","j",
    "k","l","m","n","o",
    "p","q","r","s","t",
    "u","v","w","x","y","z","-"," ",
    "あ","い","う","え","お",
    "か","き","く","け","こ",
    "さ","し","す","せ","そ",
    "た","ち","つ","て","と",
    "な","に","ぬ","ね","の",
    "は","ひ","ふ","へ","ほ",
    "ま","み","む","め","も",
    "や","ー","ゆ","-","よ",
    "ら","り","る","れ","ろ",
    "わ","を","ん","-","-",    
    "が","ぎ","ぐ","げ","ご",
    "ざ","じ","ず","ぜ","ぞ",
    "だ","ぢ","づ","で","ど",
    "ば","び","ぶ","べ","ぼ",
    "ぱ","ぴ","ぷ","ぺ","ぽ",
    "ゃ","ゅ","ょ","っ","ー",
    "ぁ","ぃ","ぅ","ぇ","ぉ"
]
function getAllCharaSetNum(seachChar){
    for(let i = 0;i < ALL_CHARA_SET.length;i++){
        if(seachChar==ALL_CHARA_SET[i]) return i;
    }
    return ALL_CHARA_SET.length;
}
const AFTER_CHARA_SET=[
    "a","i","u","e","o",
    "ka","ki","ku","ke","ko",
    "sa","si","su","se","so",
    "ta","ti","tu","te","to",
    "na","ni","nu","ne","no",
    "ha","hi","hu","he","ho",
    "ma","mi","mu","me","mo",
    "ya","-","yu","-","yo",
    "ra","ri","ru","re","ro",
    "wa","wo","*","-","-",    
    "ga","gi","gu","ge","go",
    "za","zi","zu","ze","zo",
    "da","di","du","de","do",
    "ba","bi","bu","be","bo",
    "pa","pi","pu","pe","po",
    "lya","lyu","lyo","+","ー",
    "la","li","lu","le","lo"
]
const optList=["kilya,kya","kili,kyi","kilyu,kyu","kile,kye","kilyo,kyo",
"silya,sya","sili,syi","silyu,syu","sile,sye","silyo,syo",
"tilya,tya","tili,tyi","tilyu,tyu","tile,tye","tilyo,tyo",
"telya,tha","teli,thi","telyu,thu","tele,the","telyo,tho",
"nilya,nya","nili,nyi","nilyu,nyu","nile,nye","nilyo,nyo",
"hilya,hya","hili,hyi","hilyu,hyu","hile,hye","hilyo,hyo",
"hula,fa","huli,fi","hule,fe","hulo,fo",
"milya,mya","mili,myi","milyu,myu","mile,mye","milyo,myo",
"rilya,rya","rili,ryi","rilyu,ryu","rile,rye","rilyo,ryo",
"gilya,gya","gili,gyi","gilyu,gyu","gile,gye","gilyo,gyo",
"zilya,zya","zili,zyi","zilyu,zyu","zile,zye","zilyo,zyo",
"dilya,dya","dili,dyi","dilyu,dyu","dile,dye","dilyo,dyo",
"delya,dha","deli,dhi","delyu,dhu","dele,dhe","delyo,dho",
"bilya,bya","bili,byi","bilyu,byu","bile,bye","bilyo,byo",
"pilya,pya","pili,pyi","pilyu,pyu","pile,pye","pilyo,pyo",
"uli,wi","ule,we"]
const reverseOptList=["ilya,ya","ilyi,yi","ilyu,yu","ile,ye","ilyo,yo"];
const KEY_KANA_SET=[
    ["あ","3"],["い","e"],["う","4"],["え","5"],["お","6"],
    ["か","tT"],["き","gG"],["く","hH"],["け",":*"],["こ","bB"],
    ["さ","xX"],["し","dD"],["す","rR"],["せ","pP"],["そ","cC"],
    ["た","qQ"],["ち","aA"],["つ","z"],["て","wW"],["と","sS"],
    ["な","uU"],["に","iI"],["ぬ","1!"],["ね",","],["の","kK"],
    ["は","fF"],["ひ","vV"],["ふ","2\""],["へ","^~"],["ほ","-="],
    ["ま","jJ"],["み","nN"],["む","]"],["め","/"],["も","mM"],
    ["や","7"],["ゆ","8"],["よ","9"],["゛","\@\`"],["゜","["],
    ["ら","oO"],["り","lL"],["る","."],["れ",";+"],["ろ","_\\"],
    ["わ","0"],["を","0"],["ん","yY"],["ー","¥|"],
    ["ぁ","#"],["ぃ","E"],["ぅ","$"],["ぇ","%"],["ぉ","&"],
    ["ゃ","'"],["ゅ","("],["ょ",")"],["っ","Z"],["、","<"],["。",">"]]
const DIATRIC_SET=[
    ["がぎぐげござじずぜぞだぢづでどばびぶべぼ","かきくけこさしすせそたちつてとはひふへほ"],
    ["ぱぴぷぺぽ","はひふへほ"]
]
function getRome(s,noOpt){
    //ひらがなから標準的な打鍵ローマ字を返却する関数 "*"と"+"が含まれる文字列は不可
    //標準的な打鍵ローマ字は、optListにある最適化とltuの母音重ねによる最適化を施した打ち方　nはできるだけ1つ
    // s:　ローマ字を取得する単語　ひらがな
    // noOpt: 最適化を拒否するかどうか（英文に使用）　現時点では日本語と英語の混在は不可
    // (return): sの標準的な打鍵ローマ字
    let afterS="";
    for(let i = 0;i < s.length;i++){
        let searchFlg=0;
        for(let j = 0;j < CHARA_SET.length;j++){
            if(CHARA_SET[j] == s.substr(i,1)){
                afterS+=AFTER_CHARA_SET[j];
                searchFlg=1;
                break;
            }
        }
        if(!searchFlg) afterS+=s.substr(i,1);
        if(searchFlg){//処理を保留した特殊文字を処理
            if(afterS.substr(afterS.length-1,1) == "*"){//「ん」の場合
                if(i == s.length-1){//末尾の「ん」はnが2回必要
                    afterS=afterS.substr(0,afterS.length-1) + "nn";
                } else{//その他  あ行orな行orや行or「ん」が続くなら2回必要
                    if(s[i+1] == "あ" || s[i+1] == "い" || s[i+1] == "う" || s[i+1] == "え" || s[i+1] == "お" || s[i+1] == "ん"
                    || s[i+1] == "な" || s[i+1] == "に" || s[i+1] == "ぬ" || s[i+1] == "ね" || s[i+1] == "の"
                    || s[i+1] == "や" || s[i+1] == "ゆ" || s[i+1] == "よ"){
                        afterS=afterS.substr(0,afterS.length-1) + "nn";
                    } else{
                        afterS=afterS.substr(0,afterS.length-1) + "n";
                    }
                }
            } else if(afterS.substr(afterS.length-1,1) == "+"){//「っ」の場合
                if(i != s.length-1){//末尾の「っ」以外を処理
                    //あ行orな行or「ん」が続く時以外に処理
                    if(!(s[i+1] == "あ" || s[i+1] == "い" || s[i+1] == "う" || s[i+1] == "え" || s[i+1] == "お" || s[i+1] == "ん"
                    || s[i+1] == "な" || s[i+1] == "に" || s[i+1] == "ぬ" || s[i+1] == "ね" || s[i+1] == "の")){
                        let nextChildChar="";//続く子音
                        for(let j = 0;j < CHARA_SET.length;j++){
                            if(CHARA_SET[j] == s.substr(i+1,1)) {
                                nextChildChar=AFTER_CHARA_SET[j].substr(0,1);
                                break;
                            }
                        }
                        if(nextChildChar!="") {
                            afterS=afterS.substr(0,afterS.length-1) + nextChildChar;
                        } else{
                            afterS=afterS.substr(0,afterS.length-1) + "ltu";
                        }
                    }
                }
            }
        }
    }
    if(noOpt) return afterS;
    for(let i = 0; i < optList.length;i++){
        if(afterS.indexOf(optList[i].split(",")[0])!=-1){
            afterS=afterS.split(optList[i].split(",")[0]).join(optList[i].split(",")[1]);
        }
    }
    return afterS;
}

function checkOpt(targetStr,typingStr,typistMode){
    // 入力が受理可能かどうかを判断する関数
    // typingStrの最後の文字が受理可能化どうかを判定する
    // targetStr 標準的な打鍵ローマ字
    // typingStr 打鍵されたローマ字
    // typistMode 非効率な最適化を弾くかどうか　1なら非効率なものは受理しない　指定なしなら0
    // (return): {isMiss: 0-最適化可能(受理可能)　1-最適化不可能(受理不可能), newTargetStr:最適化を適用した後の文字列}
    if(typistMode==undefined) typistMode=0;
    if(targetStr.substr(0,typingStr.length) == typingStr) return {isMiss:0,newTargetStr:targetStr};//同じ文字列なら受理
    if(typingStr.substr(typingStr.length-1,1) == "n"){ /// n>nn
        if(typingStr.substr(typingStr.length-2,1) == "n"){
            if(typingStr.substr(typingStr.length-3,1) != "x" && typingStr.substr(typingStr.length-3,1) !="n" && !(targetStr.substr(typingStr.length-1,1) == "a"||targetStr.substr(typingStr.length-1,1) == "i"||targetStr.substr(typingStr.length-1,1) == "u"||targetStr.substr(typingStr.length-1,1) == "e"||targetStr.substr(typingStr.length-1,1) == "o")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "n" + targetStr.substr(typingStr.length-1)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "n"){ /// nn>xn  ● nk nnna nnnn ✕ (x)nna (n)nna
        if(typingStr.substr(typingStr.length-1,1) == "x"){//まず、n(子音)のパターンを分ける
            if(targetStr.substr(typingStr.length-2,1) != "x" && !(targetStr.substr(typingStr.length,1) == "a"||targetStr.substr(typingStr.length,1) == "i"||targetStr.substr(typingStr.length,1) == "u"||targetStr.substr(typingStr.length,1) == "e"||targetStr.substr(typingStr.length,1) == "o"||targetStr.substr(typingStr.length,1) == "n")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "x" + targetStr.substr(typingStr.length-1)};
            } else if(targetStr.substr(typingStr.length-2,1) != "x" && targetStr.substr(typingStr.length,1) == "n" && !(targetStr.substr(typingStr.length+1,1) == "a"||targetStr.substr(typingStr.length+1,1) == "i"||targetStr.substr(typingStr.length+1,1) == "u"||targetStr.substr(typingStr.length+1,1) == "e"||targetStr.substr(typingStr.length+1,1) == "o")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "x" + targetStr.substr(typingStr.length)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "l"){ /// la>xa
        if(typingStr.substr(typingStr.length-1,1) == "x"){
            if(targetStr.substr(typingStr.length,1) == "a"||targetStr.substr(typingStr.length,1) == "i"||targetStr.substr(typingStr.length,1) == "u"||targetStr.substr(typingStr.length,1) == "e"||targetStr.substr(typingStr.length,1) == "o" ||targetStr.substr(typingStr.length,1) == "t" ||targetStr.substr(typingStr.length,1) == "y"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "x" + targetStr.substr(typingStr.length)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "i"){ //si>shi
        if(typingStr.substr(typingStr.length-1,1) == "h"){
            if(targetStr.substr(typingStr.length-2,1) == "s"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "h" + targetStr.substr(typingStr.length-1)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "i" || targetStr.substr(typingStr.length-1,1) == "e"){ //wi,we>whi,whe
        if(typingStr.substr(typingStr.length-1,1) == "h"){
            if(targetStr.substr(typingStr.length-2,1) == "w"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "h" + targetStr.substr(typingStr.length-1)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "u"){ //tu>tsu
        if(typingStr.substr(typingStr.length-1,1) == "s"){
            if(targetStr.substr(typingStr.length-2,1) == "t"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "s" + targetStr.substr(typingStr.length-1)};
            }
        }
    }//以下、「っ」が関係するもの
    if(targetStr.substr(typingStr.length-1,1) == "k"){//// ca cu co
        if(typingStr.substr(typingStr.length-1,1) == "c"){
            if(targetStr.substr(typingStr.length,1) == "a" || targetStr.substr(typingStr.length,1) == "u" || targetStr.substr(typingStr.length,1) == "o"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "c" + targetStr.substr(typingStr.length)};
            } else if (typingStr.substr(typingStr.length-1,1) != "k" && targetStr.substr(typingStr.length,1) == "k" && (targetStr.substr(typingStr.length+1,1) == "a" || targetStr.substr(typingStr.length+1,1) == "u" || targetStr.substr(typingStr.length+1,1) == "o")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "cc" + targetStr.substr(typingStr.length+1)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "s"){ ///si se > ci ce
        if(typingStr.substr(typingStr.length-1,1) == "c"){
            if(targetStr.substr(typingStr.length,1) == "i" || targetStr.substr(typingStr.length,1) == "e"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "c" + targetStr.substr(typingStr.length)};
            } else if (typingStr.substr(typingStr.length-1,1) != "s" && targetStr.substr(typingStr.length,1) == "s" && (targetStr.substr(typingStr.length+1,1) == "i" || targetStr.substr(typingStr.length+1,1) == "e")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "cc" + targetStr.substr(typingStr.length+1)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "z"){ ///zi>ji
        if(typingStr.substr(typingStr.length-1,1) == "j"){
            if(targetStr.substr(typingStr.length,1) == "i"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "j" + targetStr.substr(typingStr.length)};
            } else if (typingStr.substr(typingStr.length-1,1) != "z" && targetStr.substr(typingStr.length,1) == "z" && targetStr.substr(typingStr.length+1,1) == "i"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "jj" + targetStr.substr(typingStr.length+1)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "t"){ /// ti>chi
        if(typingStr.substr(typingStr.length-1,1) == "c"){
            if(targetStr.substr(typingStr.length,1) == "i"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "ch" + targetStr.substr(typingStr.length)};
            } else if(typingStr.substr(typingStr.length-1,1) != "t" && targetStr.substr(typingStr.length,1)  == "t" && targetStr.substr(typingStr.length+1,1)  == "i"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "cch" + targetStr.substr(typingStr.length+2)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "t"){ /// tya>cha
        if(typingStr.substr(typingStr.length-1,1) == "c"){
            if(targetStr.substr(typingStr.length,1) == "y"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "ch" + targetStr.substr(typingStr.length+1)};
            }else if(typingStr.substr(typingStr.length-1,1) != "t" && targetStr.substr(typingStr.length,1)  == "t" && targetStr.substr(typingStr.length+1,1)  == "y"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "cch" + targetStr.substr(typingStr.length+2)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "z"){ //zya>ja
        if(typingStr.substr(typingStr.length-1,1) == "j"){
            if(targetStr.substr(typingStr.length,1) == "y" && (targetStr.substr(typingStr.length+1,1) != "i")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "j" + targetStr.substr(typingStr.length+1)};
            } else if(typingStr.substr(typingStr.length-1,1) != "z" && targetStr.substr(typingStr.length,1)  == "z" && targetStr.substr(typingStr.length+1,1)  == "y"&& targetStr.substr(typingStr.length+2,1)  != "i"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "jj" + targetStr.substr(typingStr.length+2)};
            }
        }
    }

    if(targetStr.substr(typingStr.length-1,1) == "y"){ /// sya>sha
        if(typingStr.substr(typingStr.length-1,1) == "h"){
            if(targetStr.substr(typingStr.length-2,1) == "s"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "h" + targetStr.substr(typingStr.length)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "h"){ /// cha>cya
        if(typingStr.substr(typingStr.length-1,1) == "y"){
            if(targetStr.substr(typingStr.length-2,1) == "c" && (typingStr.substr(typingStr.length,1) != "i")){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "y" + targetStr.substr(typingStr.length)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-1,1) == "h"){ ///  hu>fu
        if(typingStr.substr(typingStr.length-1,1) == "f"){
            if(typingStr.substr(typingStr.length,1) != "u"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "f" + targetStr.substr(typingStr.length)};
            }
        }
    }
    if(targetStr.substr(typingStr.length-2,1) == "j"){     //ja>jya
        if(typingStr.substr(typingStr.length-1,1) == "y"){
            if(targetStr.substr(typingStr.length,1) == "a" ||targetStr.substr(typingStr.length,1) == "u" ||targetStr.substr(typingStr.length,1) == "e" ||targetStr.substr(typingStr.length,1) == "o"){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + "y" + targetStr.substr(typingStr.length-1)};
            }
        }
    }

    if(typistMode) return {isMiss:1,newTargetStr:targetStr};//タイピストモードで受理するものはここまで

    //非効率なものの処理 sya→silyaなど
    //targetStr typingStr
    for(let i = 0;i < reverseOptList.length;i++){
        if(targetStr.substr(typingStr.length-1,reverseOptList[i].split(",")[1].length) == reverseOptList[i].split(",")[1]){
            if(typingStr.substr(typingStr.length-1,1) == reverseOptList[i].split(",")[0].substr(0,1)){
                return {isMiss:0,newTargetStr:targetStr.substr(0,typingStr.length-1) + reverseOptList[i].split(",")[0] + targetStr.substr(typingStr.length-1 + reverseOptList[i].split(",")[1].length)};
            }
        }
    }
    //っを単体で打つ処理　未実装
    
    return {isMiss:1,newTargetStr:targetStr};//それ以外なら不受理（最適化未実装)
}
function keyToKana(myKey,shift){//押されたキーからひらがなへ変換する関数
    if(shift==undefined) shift=0;
    for(let i = 0;i < KEY_KANA_SET.length;i++){
        if(KEY_KANA_SET[i][1].indexOf(myKey) != -1){
            if(myKey=="0"){
                if(shift){
                    return "を";
                } else{
                    return "わ";
                }
            } else{
                return KEY_KANA_SET[i][0];
            }
        }
    }
    return -1;
}
function checkKana(targetStr,typingStr){
    //かな入力の受理を処理する関数　{isMiss, newTargetStr};を返却
    //isMissが0なら受理、1なら不受理 shiftKey==trueでシフトキー同時押し
    //targetStrはひらがなで、typingStrは
    if(targetStr.substr(0,typingStr.length) == typingStr) return {isMiss:0,newTargetStr:targetStr};//同じ文字列なら受理
    return {isMiss:1,newTargetStr:targetStr};//それ以外は不受理
}
function getKana(myStr){//かな入力のひらがなを返却する 濁点と半濁点をバラす
    for(let i = 0;i < myStr.length;i++){
        if(DIATRIC_SET[0][0].indexOf(myStr.substr(i,1)) != -1){
            myStr=myStr.substr(0,i) + DIATRIC_SET[0][1].substr(DIATRIC_SET[0][0].indexOf(myStr.substr(i,1)),1) + "゛" + myStr.substr(i+1);
        }else if(DIATRIC_SET[1][0].indexOf(myStr.substr(i,1)) != -1){
            myStr=myStr.substr(0,i) + DIATRIC_SET[1][1].substr(DIATRIC_SET[1][0].indexOf(myStr.substr(i,1)),1) + "゜" + myStr.substr(i+1); 
        }
    }
    return myStr;
}