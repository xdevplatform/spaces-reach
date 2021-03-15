class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
    
    // this.queries = Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery;
  }
  
  getInitialState() {
    return {
      queries: Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery,
      done: {}
    };
  }
  
  didReceiveData(response) {
    console.log(response)
  }
  
  render() {}
}