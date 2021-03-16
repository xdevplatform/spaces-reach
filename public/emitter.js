class Emitter {
  setState(value) {
    const newstate = JSON.stringify(value);
    if (newstate === null) {
      return true;
    }

    const oldstate = JSON.stringify(this.state);
    if (oldstate !== newstate) {
      this.state = Object.assign(this.state, JSON.parse(newstate));
      typeof this.stateDidChange === 'function' ? this.stateDidChange() : null;
      typeof this.render === 'function' ? this.render() : null;
    }
  }

  didReceiveData(data) {}

  childNodes(className = null) {
    let selector = '';
    if (typeof className === 'function') {
      selector = '=' + className.name;
    } else if (typeof className === 'string') {
      selector = '=' + className;
    }

    return this.component.querySelectorAll(`[e\\:class${selector}]`);
  }

  constructor(element) {
    this.component = element;
    this.component.instance = this;
    this.state = typeof this.getInitialState === 'function' ? this.getInitialState() : {};
    this.props = {};

    [this.component, ...this.component.querySelectorAll(':not([e\\:class])')].forEach(el => {
      el.getAttributeNames().forEach(key => {
        if (key === 'e:class') {
          return false;
        }

        let attributeName = key.replace('e:', '').replace(/[-_\s]+(.)?/g, (match, ch) => (ch ? ch.toUpperCase() : ''));
        attributeName = attributeName.substr(0, 1).toLowerCase() + attributeName.substr(1);

        this.props[attributeName] = el.getAttribute(key);
        
        const event = key.replace('e:', '');
        const functionName = el.getAttribute(key);

        if (typeof this[functionName] === 'function' && typeof window[`on${event}`] !== 'undefined') {
          el.addEventListener(event, this[functionName].bind(this));
        }
        
      });
    });
  }

  //static registry = new WeakMap();

  static async dispatch(dispatchFn) {
    const data = dispatchFn instanceof Promise ? await dispatchFn : dispatchFn;
    document.querySelectorAll('[e\\:class]').forEach(el => Emitter.registry.get(el)?.didReceiveData(data));
    return data;
  }

  static init(path = '') {
    const elements = document.querySelectorAll('[e\\:class]');
    const initFn = (elements) =>
      elements.forEach(element => {        
        if (element.childElementCount) {
          initFn(element.childNodes);
        }

        if (typeof element.hasAttribute === 'undefined' || Emitter.registry.has(element)) {
          return;
        }

        if (!element.hasAttribute('e:class')) {
          return;
        }
        
        const className = element.getAttribute('e:class');
        const fn = new Function('element', `return new ${className}(element)`);
        if (new Function(`return typeof ${className} !== 'undefined'`)()) {
          Emitter.registry.set(element, fn(element));
        }

        if (!document.querySelector(`script[for='${className}']`)) {
          const script = document.createElement('script');
          script.setAttribute('src', `${path}${className}.js`);
          script.setAttribute('async', '');
          script.setAttribute('for', className);
          script.onload = () => {
            document.querySelectorAll(`[e\\:class=${className}]`).forEach(element => Emitter.registry.set(element, fn(element)));
          };
          document.head.appendChild(script);
        }
        
      });

      const observer = new MutationObserver((mutations) => {
        const addedNodeLists = mutations.map(mutation => mutation.addedNodes);
        addedNodeLists.forEach(nodeList => initFn(nodeList));
      });
      observer.observe(document.body, {subtree: true, childList: true});
      initFn(elements);
  }
}
Emitter.registry = new WeakMap();