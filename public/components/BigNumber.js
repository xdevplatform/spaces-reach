class BigNumber extends Emitter {
  constructor(element) {
    super(element);
    this.title = element.querySelector('h2');
    this.number = element.querySelector('h4.trend');
    this.loading = element.querySelector('h4.loading');
    
    this.chart = this.childNodes()[0];
  }
  
  async didReceiveData(response) {
    console.log(response.url);
    const regex = new RegExp(`/counts\?${this.component.dataset.search}`);
    if (!response.url.match(/\/counts\/\?))
    try {
      const json = await response.clone().json();
      this.setState(json);
    } catch (e) {
      this.setState({error: true});
    }
  }
  
  fetch() {
    Emitter.dispatch(fetch(`/counts?q=${this.component.dataset.search}`));
    this.loading.innerText = 'Loading…';
    this.loading.hidden = false;
    Emitter.dispatch(fetch)
  }
    
  render() {
    if (this.state.error) {
      
    }
    
    this.title.innerText = this.component.dataset.name;
    this.chart.dataset.data = this.component.dataset.results;
    this.chart.dataset.volume = this.component.dataset.volume
    this.number.innerText = new Intl.NumberFormat().format(this.component.dataset.volume);
  }
}