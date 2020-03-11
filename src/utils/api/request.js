import axios from 'axios/index';
axios.defaults.withCredentials = true;
function severAddress() {
	return 'http://192.168.10.91:9999';
}
function Ajax(options) {
	let params = new URLSearchParams();
	let method = options.method ? options.method : 'POST';
	let body = null;
	for (let item in options.data) {
		params.append(item, options.data[item]);
	}
	body = new Blob([options.body]);
	axios({
		method: method,
		data: body,
		emulateJSON: true,
		withCredentials: true,
		url: severAddress() + options.url + '?' + params
	}).then(
		response => {
			options.success && typeof options.success === 'function' ? options.success(response.data) : '';
		},
		function(error) {
			options.error && typeof options.error === 'function' ? options.error(error) : '';
		}
	);
}
export { Ajax, severAddress };
