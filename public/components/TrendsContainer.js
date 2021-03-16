class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
    this.props = {};
    this.stats = [];
  }
  
  getInitialState() {
    return {done: []}
  }
  
  async didReceiveData(response) {
    if (!response.url.match(/\/counts/)) {
      return;
    }

    if (!response.ok) {
      return;
    }
    
    const url = new URL(response.url);
    const query = url.searchParams.get('q');
    if (!query) {
      return;
    }

    const countsQuery = Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery;
    const { name } = countsQuery.find(q => q.query === query);
    
    if (!name) {
      return;
    }

    const json = await response.json();
    this.setState({query: query, name: name, stats: json});
  }
  
  render() {
    if (document.querySelector(`[data-query="${this.state.query}"]`)) {
      return;
    }
    const bigNumber = document.querySelector('[e\\:class="BigNumber"]').cloneNode(true);
    bigNumber.dataset.results = this.state.stats.results;
    bigNumber.dataset.volume = this.state.stats.totalCount;
    bigNumber.dataset.name = this.state.name;
    bigNumber.dataset.query = this.state.query;
    this.stats.push(this.state);
    this.component.appendChild(bigNumber);

  }
}