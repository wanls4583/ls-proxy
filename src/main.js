import Vue from 'vue';
import ElementUI from 'element-ui';
import App from './App.vue';
import eventBus from './event'
import Scheduler from './common/scheduler';
import Script from './common/script';
import store from './store';
import { kmpSearch } from './common/utils';
import Node from './common/node';
import { saveGateway, getGateway, saveMirror, getMirror, saveRule, getRule, saveBreak, getBreak } from './common/http';
import 'element-ui/lib/theme-chalk/index.css';
import './scss/index.scss';
import './assets/font/iconfont'
import './assets/font/ext-icon'
import LsTable from './components/lib/table/Table.vue'
import LsTableColumn from './components/lib/table/TableColumn.vue'

Vue.component('LsTable', LsTable)
Vue.component('LsTableColumn', LsTableColumn)
Vue.use(ElementUI);
Vue.config.productionTip = false;
Vue.prototype.eventBus = eventBus
Vue.prototype.$store = store
window.eventBus = eventBus
window.scriptStore = new Script()
window.ruleStore = new Node({ saveNode: saveRule, getNode: getRule })
window.breakStore = new Node({ saveNode: saveBreak, getNode: getBreak })
window.mirrorStore = new Node({ saveNode: saveMirror, getNode: getMirror })
window.gatewayStore = new Node({ saveNode: saveGateway, getNode: getGateway })

String.prototype.kmpSearch = kmpSearch
Array.prototype.kmpSearch = kmpSearch
Uint8Array.prototype.kmpSearch = kmpSearch
Uint8Array.prototype.concat = function(u8Array) {
	if (!(u8Array instanceof Uint8Array)) {
		return this
	}
	let newArr = new Uint8Array(this.length + u8Array.length)
	newArr.set(this)
	newArr.set(u8Array, this.length)
	return newArr
}

window.globalData = {
	scheduler: new Scheduler()
};

new Vue({
	store,
	render: h => h(App),
}).$mount('#app');
