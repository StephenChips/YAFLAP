<template>
  <input type="text" @input="$emit('input', $event.target.value)" @keyup.enter="$emit('submit', $event.target.value)"/>
</template>

<script>
export default {
  name: 'edit-field',
  props: {
    value: { type: String }
  }
}
</script>
