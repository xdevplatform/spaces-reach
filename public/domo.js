const html = (...values) => {
  const [stringTemplate, ...parts] = values;
  const s = stringTemplate.reduce((html, el, idx) => html + el + (parts[idx] || ''), '');
  return document.createRange().createContextualFragment(s);
}

const diff = (currentDom, newDom, changes = {added: [], removed: []}) => {
  const currentLength = currentDom.children.length;
  const newLength = newDom.children.length;
  
  if (newLength === 0) {
    changes.removed.concat(Array.from(currentDom.children));
    currentDom.replaceChildren();
    return [currentDom, changes];
  }
  
  if (currentLength === 0 && newLength > 0) {
    changes.removed.concat(Array.from(currentDom.children));
    changes.added.concat(Array.from(newDom.children));
    currentDom.replaceChildren(newDom);
    return [currentDom, changes];
  }
  
  if (currentLength > newLength) {
    for (let i = currentLength - 1; i >= newLength; i--) {
      const node = currentDom.children[i];
      changes.removed.push(node.cloneNode(true))
      node.parentNode.removeChild(node);
    }
  } else if (currentLength < newLength) {
    for (let i = currentLength; i < newLength; i++) {
      const node = newDom.children[i].cloneNode(true);
      changes.added.push(node.cloneNode(true));
      currentDom.appendChild(node);
    }
  }
  
  for (let i = 0; i < newLength; i++) {
    const currentNode = currentDom.children[i];
    const newNode = newDom.children[i];
    
    if (currentNode.children.length && newNode.children.length > 0) {
      diff(currentNode, newNode, changes);
    }

    if (!currentNode.shadowRoot && newNode.shadowRoot) {
      diff(currentNode, newNode.shadowRoot, changes)
    }

    if (currentNode.shadowRoot && !newNode.shadowRoot) {
      diff(currentNode.shadowRoot, newNode, changes)
    }

    if (currentNode.outerHTML !== newNode.outerHTML) {
      changes.removed.push(currentNode.cloneNode(true));
      changes.added.push(newNode.cloneNode(true));
      currentNode.replaceWith(newNode.cloneNode(true));
    }    
  }

  return [currentDom, changes];
}

const classNameFromTag = tag =>
  tag
    .split('-')
    .map(part => 
      part
        .charAt(0)
        .toUpperCase() + 
      part
        .slice(1)
        .toLowerCase())
    .join('');

const init = async (el) => {
  if (!el.tagName?.includes('-')) {
    return;
  }

  const tag = el.tagName.toLowerCase();
  const href = document.querySelector('link[rel="components"]')?.href;
  const path = el.getAttribute('module');
  const module = await import(href || path);    

  if (!customElements.get(tag)) {
    try {
      customElements.define(tag, href ? module[classNameFromTag(tag)] : module.default);  
      await customElements.whenDefined(tag);
    } catch (e) { console.error(`Could not initialize <${tag}>. Check that the component exist and that is has been imported. (${e.message})`); }
    
  }
};

const setupListeners = (component, element) => {
  for (const child of element.children) {
    if (child.tagName && !child.tagName.includes('-')) {
      setupListeners(component, child); 
    }
  }
  
  return element.getAttributeNames()
    .filter(key => key.match(/^on\-/))
    .map(key => element.addEventListener(key.replace('on-', ''), component[element.getAttribute(key)].bind(component), false));
}

const render = element => {
  if (element.componentWillRender.bind(element)()) {
    const template = element.render.bind(element)();
    if (template instanceof DocumentFragment) {
      diff(element.shadowRoot, template);
    }
    
    if (template) {
      element.componentDidRender.bind(element)();
    }
  }
}

export default class extends HTMLElement {
  constructor() {
    super();
    this.state = this.getInitialState();

    this.attachShadow({ mode: 'open' });

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes) {
          Array
            .from(mutation.addedNodes)
            .map(el => init(el) && el.getAttributeNames && setupListeners(this, el))
        }
        
        if (mutation.type === 'attributes' && mutation.target.tagName.includes('-') && mutation.attributeName.match(/data-/)) {
          const datasetKey = mutation.attributeName.replace('data-', '');
          mutation.newValue = mutation.target.getAttribute(mutation.attributeName);
          mutation.datasetKey = classNameFromTag(datasetKey);
          mutation.datasetKey = mutation.datasetKey.charAt(0).toLowerCase() + mutation.datasetKey.slice(1);
          mutation.target.didUpdateDataset(mutation);
        }
      });
    }).observe(this.shadowRoot, {attributes: true, childList: true, subtree: true, attributeOldValue: true});
    render(this);
    init(this.shadowRoot);
  }
   
  setState(value) {
    const newstate = JSON.stringify(value);
    if (newstate === null) {
      return true;
    }

    const oldstate = JSON.stringify(this.state);
    if (oldstate !== newstate) {
      this.state = Object.assign(this.state, JSON.parse(newstate));
      this.stateDidChange();
      render(this);
    }
  }
  
  getInitialState() { return { } }
  stateDidChange() { }
  componentWillRender() { return true }
  didUpdateDataset(mutation) { }
  componentDidRender() { }
  render() { }
}

export { init, html, diff };