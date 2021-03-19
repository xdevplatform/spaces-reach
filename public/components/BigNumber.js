class BigNumber extends Emitter {
  constructor(element) {
    super(element);
    this.link = element.querySelector('a');
    this.title = element.querySelector('h2');
    this.number = element.querySelector('h4.trend');
    this.loading = element.querySelector('h4.loading');
    this.error = element.querySelector('h4.error');
    
    this.chart = this.childNodes()[0];
    this.fetch();
  }
  
  async didReceiveData(response) {
    const regex = new RegExp(`\\/counts\\?q=${this.component.dataset.search}`);
    if (!response.url.match(regex)) {
      return;
    }
    
    try {
      const json = await response.clone().json();
      this.setState(json);
    } catch (e) {
      this.setState({error: true});
    }
  }
  
  fetch() {
    Emitter.dispatch(fetch(`/counts?q=${this.component.dataset.search}`));
    this.error.hidden = true;
    this.loading.hidden = false;
  }
  
  prepareLink() {
    const url = new URL('https://twitter.com/search');
    
    
    if (this.component.dataset.query.match(/^context/)) {
      const entityId = this.component.dataset.query.replace('context:', '');
      url.searchParams.append('q', `(* [entity_id ${entityId}])`);
    } else if (this.component.dataset.query.match(/^[#@]/)) {
      url.searchParams.append('q', this.component.dataset.query);
    }

    this.link.href = url;

  }
    
  render() {
    this.title.innerText = this.component.dataset.name;
    
    if (this.state.error) {
      this.chart.hidden = true;
      this.loading.hidden = true;
      this.error.hidden = false;
      return;
    } else if (this.state.loading) {
      this.chart.hidden = true;
      this.loading.hidden = false;
      this.error.hidden = true;
      return;
    }
    
    if (this.state.results) {
      this.error.hidden = true;
      this.loading.hidden = true;
      this.chart.hidden = false;
      this.prepareLink();
      
      this.chart.dataset.data = JSON.stringify(this.state.results);
      this.chart.dataset.volume = this.state.totalCount;
      this.number.innerText = new Intl.NumberFormat().format(this.state.totalCount);
    }
    
  }
}