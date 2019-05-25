<template>
  <table>
    <tbody>
      <tr>
        <td class="row-header">N/A</td>
        <td class="row-header" v-for="rowTitle of rowTitleList" :key="rowTitle">
          {{ rowTitle }}
        </td>
      </tr>
      <tr v-for="colTitle of colTitleList" :key="colTitle">
        <td class="col-header">{{ colTitle }}</td>
        <td v-for="rowTitle of rowTitleList" :key="rowTitle">
          {{ getCellContent(colTitle, rowTitle) }}
        </td>
      </tr>
    </tbody>
</table>
</template>

<script>
export default {
  name: 'two-dimension-table',
  props: ['rowTitleList', 'colTitleList', 'relationships'],
  methods: {
    getCellContent (colTitle, rowTitle) {
      if (this.relationships[colTitle] && this.relationships[colTitle][rowTitle]) {
        return this.relationships[colTitle][rowTitle]
      } else {
        return ''
      }
    }
  },
}
</script>

<style scoped>

table {
  box-shadow: 3px 3px 0 black;
  border-collapse: collapse;
}

table td {
  width: 60px;
  height: 30px;
  border: 1px solid #999999;
  text-align: center;
}

table .row-header,
table .col-header {
  background-color: aliceblue;
  font-weight: 700;
}

</style>
