import '../sass/styles.scss'
import Scene from './Scene'
import Layout from './Layout'

const APP = window.APP || {}

/*-----------------------------------------------------------------------------------*/
/*  01. INIT
/*-----------------------------------------------------------------------------------*/

const initApp = () => {
    window.APP = APP

    APP.Store = {
        ANGLE           : Math.PI / 6,
        isTransitioning : false,
    }

    APP.Layout = new Layout()
    APP.Scene = new Scene()
}

if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    initApp()
} else {
    document.addEventListener('DOMContentLoaded', initApp)
}
