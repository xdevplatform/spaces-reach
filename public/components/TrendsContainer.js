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
      queries: Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery,
      done: {}
    };
  }
  
  didReceiveData(response) {
    if (!response.url.match(/\/counts/)) {
      return;
    }
    
    const url = new URL(response.url);
    const query = url.searchParams.get('q');
    const stats
  }
  
  render() {}
}