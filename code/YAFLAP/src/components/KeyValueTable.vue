<template>
  <table>
    <tr class="table-header">
      <td>{{ keyTitle }}</td>
      <td>{{ valueTitle }}</td>
    </tr>
    <tr v-for="item of list" :key="item.key">
      <td>{{ item.key }}</td>
      <td>{{ item.value }}</td>
    </tr>
</table>
</template>

<script>
export default {
  name: 'key-value-table',
  props: ['list', 'keyTitle', 'valueTitle']
}
</script>

<style>
table {
  box-shadow: 3px 3px 0 black;
  border-collapse: collapse;
}

table td {
  border: 1px #999999 solid;
  padding: 5px;
}

table .table-header {
  background-color: aliceblue;
  font-weight: 700;
}

</style>
