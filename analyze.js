const petsEntitiyId = '852262932607926273';

const findTweetsWithNoPets = (response) => response.data.filter(el => 
  el.context_annotations &&
  el.context_annotations.find(context => 
    context.entity.id !== petsEntitiyId));

module.exports = findTweetsWithNoPets;
