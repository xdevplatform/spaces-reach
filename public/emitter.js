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

  static init(path = '') {
    document.querySelectorAll('[e\\:class]').forEach(element => {
      const className = element.getAttribute('e:class');
      const fn = new Function('element', `new ${className}(element)`);
      if (new Function(`return typeof ${className} !== 'undefined'`)()) {
        return fn(element);
      }

      if (!document.querySelector(`script[for='${className}']`)) {
        const script = document.createElement('script');
        script.setAttribute('src', `${path}${className}.js`);
        script.setAttribute('async', '');
        script.setAttribute('for', className);
        script.onload = () => {
          document.querySelectorAll(`[e\\:class=${className}]`).forEach(element => fn(element));
        };
        document.head.appendChild(script);
      }
    });   
  }
}