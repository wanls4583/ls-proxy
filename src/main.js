import Vue from 'vue';
import ElementUI from 'element-ui';
import App from './App.vue';
import eventBus from './event'
import 'element-ui/lib/theme-chalk/index.css';
import './scss/index.scss';
import Scheduler from './common/scheduler';
import { kmpSearch } from './common/utils';

Vue.use(ElementUI);
Vue.config.productionTip = false;
Vue.prototype.eventBus = eventBus

String.prototype.search = kmpSearch
Uint8Array.prototype.search = kmpSearch

window.globalData = {
	scheduler: new Scheduler()
};

new Vue({
	render: h => h(App),
}).$mount('#app');
