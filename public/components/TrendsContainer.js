class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
    this.props = {};
    // this.props.queries = Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery;
    // this.props.queries.map(query => Emitter.dispatch(fetch(`/counts/${Object.entries(query[0][0])}`)));
  }
  
  getInitialState() {
    return {done: {}}
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
    const done = Object.create(this.state.done);
    done[query] = {query: query, name: name, stats: json};
    console.log(done);
    this.setState({done: this.state.done});
  }
  
  render() {
    console.log(this.state)
    this.state.done.forEach(stat => {
      console.log(stat, stat.query);

      if (document.querySelector(`[data-query="${stat.query}"]`)) {
        return;
      }
      const bigNumber = document.querySelector('[e\\:class="BigNumber"]').cloneNode(true);
      bigNumber.dataset.results = stat.stats.results;
      bigNumber.dataset.volume = stat.stats.totalCount;
      bigNumber.dataset.name = stat.name;
      bigNumber.dataset.query = stat.query;
      this.component.appendChild(bigNumber);
    })    
  }
}