import Vue from 'vue';
import ElementUI from 'element-ui';
import App from './App.vue';
import eventBus from './event'
import 'element-ui/lib/theme-chalk/index.css';
import './scss/index.scss';

Vue.use(ElementUI);
Vue.config.productionTip = false;
Vue.prototype.eventBus = eventBus

new Vue({
	render: h => h(App),
}).$mount('#app');
