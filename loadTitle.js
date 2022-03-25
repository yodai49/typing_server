var loadPfnw=performance.now();//ページが開かれた時間を記録しておく
var loadedPfnw=-1,loadingCount=0;

window.addEventListener('load', init); //ロードイベント登録
window.addEventListener('DOMContentLoaded', function(){ //クリックイベント登録
    ctx2d=document.getElementById("myCanvas").getContext("2d");
    ctx2dImg=document.getElementById("myCanvas2").getContext("2d");
    ctxHid=document.getElementById("hiddenCanvas").getContext("2d");
    canHid=document.getElementById("hiddenCanvas");
});

function init() {
    //ローディング処理////////////////////////////////////////

    //2Dの処理
    ctx2d.width = WIDTH;
    ctx2d.height = HEIGHT;
    ctx2d.textBaseLine="top";
    //画像の格納
        //example
/*    coinImg=new Image();
    coinImg.src="./img/coin.png";
    coinImg.onload=()=>{imgLoadedCnt++;};*/

    tick();

    function tick() {
        t=performance.now()-loadPfnw;
    
        //リセット処理
        ctx2d.clearRect(0,0,WIDTH,HEIGHT);
        ctx2dImg.clearRect(0,0,WIDTH,HEIGHT);
    
        ctx2d.font="24px " + MAIN_FONTNAME;
        if(scene!=0){
            ctx2d.fillText("ERROR",(WIDTH-ctx2d.measureText("ERROR").width)/2,HEIGHT/2);
        }else if(loadingCount){
            ctx2d.fillText("LOADED!",(WIDTH-ctx2d.measureText("LOADED!").width)/2,HEIGHT/2);
        } else{
            ctx2d.fillText("LOADING",(WIDTH-ctx2d.measureText("LOADING").width)/2,HEIGHT/2);
            ctx2d.font="12px " + MAIN_FONTNAME;
            ctx2d.fillText(imgLoadedCnt + " / " + IMG_CNT,(WIDTH-ctx2d.measureText(imgLoadedCnt + " / " + IMG_CNT).width)/2,HEIGHT/2+25);
        }
        if(DEBUG_MODE) SCENE_ANI=100;
        if(imgLoadedCnt!=IMG_CNT || sceneAni || performance.now() - sceneAni < SCENE_ANI*2) requestAnimationFrame(tick);
    }
}