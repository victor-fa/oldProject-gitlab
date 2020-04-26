import axios from 'axios'
import { NAS_ACCESS } from '@/common/constants'
import { message } from 'ant-design-vue'

const CancelToken = axios.CancelToken
const source = CancelToken.source()

// json对象转url参数
const jsonToParams = (options) => {
  let params = new URLSearchParams();
  if (options !== null) {
    for (let item in options) {
      params.append(item, options[item]);
    }
  }
  params.append('api_token', apiToken); // 每个url都添加token
  return params
}

// json对象转url参数
const jsonToParamsForPdf = (options) => {
  let params = '';
  params += 'api_token=' + apiToken;
  if (options !== null) {
    for (let item in options) {
      params += '&' + item + '=' + options[item];
    }
  }
  console.log(params);
  return params
}

const isResponsePass = (rs) => {
  let flag = true;
  if (rs.data.code !== 200) {
    flag = false
    message.warning(rs.data.msg)
  }
  return flag
}

export {
  jsonToParams,
  jsonToParamsForPdf,
  isResponsePass,
  source
}
