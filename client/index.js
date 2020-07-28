const needle = require('needle');
const package = require('../package.json');
const oauth = require('../oauth');
needle.defaults({user_agent: `${package.name}/${package.version}`})

let defaultOptions = {};
const defaults = (config) => {
  defaultOptions = Object.assign(defaultOptions, config);
}

const auth = (method, url, options, body) => {
  const {oauth} = require('../oauth');

  if (Object.prototype.toString.call(options) !== '[object Object]') {
    return {};
  }
  options.headers = options.headers || {};
  options.headers = Object.assign(options.headers, defaultOptions.headers || {});
  if (options.oauth) {
    options.headers.authorization = oauth(url, method, options, !!options.json ? {} : body);
  } else if (options.bearer) {
    options.headers.authorization = `Bearer ${options.bearer}`;
  }

  return options;
}

const get = ({url, ...options}) => {
  method = 'GET';
  options.options = auth(method, url, options.options);
  return needle(method, url, null, options.options);
}

const del = ({url, ...options}) => {
  method = 'DELETE';
  options.options = auth(method, url, options.options);
  return needle(method, url, null, options.options);
}

const post = ({url, body = {}, ...options}) => {
  method = 'POST';
  options.options = auth(method, url, options.options, body);
  return needle(method, url, body, options.options);
}

const put = ({url, body = {}, ...options}) => {
  method = 'PUT';
  options.options = auth(method, url, options.options, body);
  return needle(method, url, body, options.options);
}

module.exports = { get, del, post, put, defaults };