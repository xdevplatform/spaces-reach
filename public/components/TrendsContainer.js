class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
    this.props = {};
    this.props.queries = Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery;
    console.log(this.props.queries);
    this.props.queries.map(query => Emitter.dispatch(fetch(`/counts/${Object.entries(query[0][0])}`)));
  }
  
  getInitialState() {
    return {
      done: []
    };
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

    const { name } = this.props.queries.find(q => q.query === query );
    if (!name) {
      return;
    }

    const done = this.state.done;
    done.push({query: query, name: name, stats: await response.clone().json()});
    this.setState({done: done});
  }
  
  render() {
    this.state.done.forEach(stat => {
      if (document.querySelector(`[data-query="${stat.query}"]`)) {
        return;
      }
      
      const bigNumber = document.querySelector('[e\\:class="BigNumber"]').cloneNode(true);
      big
      bigNumber.props.stats = stat.stats
      
    })    
  }
}