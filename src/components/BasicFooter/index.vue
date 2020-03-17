<template>
  <div class="basic-footer">
    <label>{{ data }}</label>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  data () {
    return {
    }
  },
	props: {
		data: {
			type: String
		}
	}
})
</script>

<style lang="less" scoped>
.basic-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  label {
    font-size: 12px;
    color: #484848;
    line-height: 17px;
    margin-right: 18px;
  }
}
</style>
