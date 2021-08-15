const constants = {
  Live: 'live',
  Scheduled: 'scheduled',
  Ended: 'ended',
  Canceled: 'canceled',
}

export const {
  Live,
  Scheduled,
  Ended,
  Canceled,
} = constants;

export const chartKey = (id) => `chart-${id}`;