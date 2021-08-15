import needle from 'needle';
import { oauth } from '../oauth-signature/index.js';
import { readFileSync } from 'fs';
const { name, version } = JSON.parse(readFileSync('../package.json'));
needle.defaults({user_agent: `${name}/${version}`});

let defaultOptions = {};
const defaults = (config) => {
  defaultOptions = Object.assign(defaultOptions, config);
}

const auth = (method, url, options, body) => {
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
  const method = 'GET';
  options.options = auth(method, url, options.options);

  return needle(method, url, null, options.options);
}

const del = ({url, ...options}) => {
  const method = 'DELETE';
  options.options = auth(method, url, options.options);
  return needle(method, url, null, options.options);
}

const post = ({url, body = {}, ...options}) => {
  const method = 'POST';
  options.options = auth(method, url, options.options, body);
  return needle(method, url, body, options.options);
}

const put = ({url, body = {}, ...options}) => {
  const method = 'PUT';
  options.options = auth(method, url, options.options, body);
  return needle(method, url, body, options.options);
}

export { get, del, post, put, defaults };