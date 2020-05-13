<template>
  <div class="modal-wrapper">
    <div
      class="move-modal"
      v-bind:class="{ 
        'show-move-modal': !hideModal,
        'hide-move-modal': hideModal
      }"
    >
      <div class="modal-header">
        <div class="indicator">
          <custom-button
            class="btn-item"
            :image="backwardIcon"
            iconWidth="21px"
            @click="handleBackwardAction"
          />
          <custom-button
            class="btn-item"
            :image="forwardIcon"
            iconWidth="21px"
            @click="handleForwardAction"
          />
        </div>
        <span>请选择目标目录</span>
        <custom-button
          class="close-btn"
          :image="closeIcon"
          iconWidth="11px"
          @click="handleCloseAction"
        />
      </div>
      <a-breadcrumb separator=">" class="modal-breadcrumb" ref="breadcrumb">
        <a-breadcrumb-item v-for=" (path, index) in pathArray" :key="index" href="">
          {{ path }}
        </a-breadcrumb-item>
      </a-breadcrumb>
      <div class="modal-content">
        <a-spin :spinning="loading">
          <basic-list
            class="content-list"
            :dataSource="showArray"
            v-on:loadMoreData="handleLoadMoreAction"
          >
            <template v-slot:renderItem="{ item }">
              <div class="content-list-item">
                <img src="../../../assets/resource/folder_icon.png">
                <span>{{ item.name }}</span>
              </div>
            </template>
          </basic-list>
        </a-spin>
      </div>
      <div class="modal-footer">
        <a-button @click="handleNewlAction">新建文件夹</a-button>
        <div>
          <a-button @click="handleCancelAction">取消</a-button>
          <a-button @click="handleMoveAction" type="primary">移动</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import CustomButton from '../../../components/CustomButton/index.vue'
import { ResourceItem } from '../../../api/NasFileModel'
import BasicList from '../../../components/BasicList/index.vue'
import NasFileAPI from '../../../api/NasFileAPI'

export default Vue.extend({
  name: 'resource-move-modal',
  components: {
    CustomButton,
    BasicList
  },
  data () {
    return {
      loading: false,
      page: 1,
      hideModal: false,
      pathArray: ['全部文件'] as string[],
      showArray: [{ name: 'test1' }, { name: 'test2' }, { name: 'test3' }, { name: 'test4' }, { name: 'test4' }, { name: 'test4' }, { name: 'test4' }, { name: 'test4' }],
      dataArray: [] as ResourceItem[],
      closeIcon: require('../../../assets/close_icon.png'),
      forwardIcon: require('../../../assets/forward_icon.png'),
      backwardIcon: require('../../../assets/backward_icon.png')
    }
  },
  created () {
    this.fetchFolderList()
  },
  mounted () {
    this.pathArray = this.pathArray.concat(['Application Center', 'Application List', 'An Application', 'An Application', 'An Application'])
    this.$nextTick(() => {
      const breadcrumb = this.$refs.breadcrumb
      console.log(breadcrumb)
    })
  },
  methods: {
    fetchFolderList () {
      // this.loading = true
      // NasFileAPI.fetchResourceList()
    },
    handleLoadMoreAction () {

    },
    handleBackwardAction () {

    },
    handleForwardAction () {

    },
    handleCloseAction () {

    },
    handleNewlAction () {

    },
    handleCancelAction () {
      this.hideModal = true
      setTimeout(() => {
        this.$emit('moveCompleted')
      }, 350);
    },
    handleMoveAction () {

    }
  }
})
</script>

<style lang="less" scoped>
.modal-wrapper {
  height: 100vh;
  width: 100vw;
  top: 0px;
  left: 0px;
  position: absolute;
  .move-modal {
    width: 445px;
    height: 343px;
    margin: auto;
    background-color: white;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border: 1px solid #e5e5e5;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.25);
    .modal-header {
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .indicator {
        margin-left: 14px;
        .btn-item {
          width: 21px;
          height: 21px;
        }
        :first-child {
          margin-right: 4px;
        }
      }
      span {
        color: #9c9fa9;
        font-size: 14px;
        line-height: 15px;
      }
      .close-btn {
        margin-left: 25px;
        margin-right: 13px;
        height: 15px;
        width: 15px;
      }
    }
    .modal-breadcrumb {
      font-size: 12px;
      height: 30px;
      line-height: 30px;
      background-color: #f6f8fb;
      text-align: left;
      padding: 0px 10px;
      overflow: hidden;
      white-space: nowrap;
    }
    .modal-content {
      height: 229px;
      .content-list {
        height: 229px !important;
        .content-list-item {
          img {
            height: 20px;
            width: 20px;
            margin: 6px;
          }
        }
      }
    }
    .modal-footer {
      height: 44px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .ant-btn {
        color: #484848;
        font-size: 12px;
        border-radius: 4px;
        height: 22px;
      }
      .ant-btn:first-child {
        margin-left: 10px;
      }
      .ant-btn:last-child {
        margin-right: 10px;
        margin-left: 7px;
        color: white;
      }
    }
  }
  .show-move-modal {
    animation: showModal 0.35s ease-in;
  }
  .hide-move-modal {
    animation: hideModal 0.35s ease-in-out;
  }
}
@keyframes showModal {
  from { transform: translateY(-313px) };
  to { transform: translateY(0px) };
}
@keyframes hideModal {
  from { transform: translateY(0px); opacity: 1.0; };
  to { transform: translateY(-313px); opacity: 1.0; };
}
</style>
