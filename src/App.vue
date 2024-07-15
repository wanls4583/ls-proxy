<template>
  <div id="app">
    <ls-header />
    <type-filter />
  </div>
</template>

<script>
import Header from './components/Header.vue'
import TypeFilter from './components/TypeFilter.vue'
export default {
  name: 'App',
  components: {
    LsHeader: Header,
    TypeFilter,
  },
}
</script>

<style>
</style>
