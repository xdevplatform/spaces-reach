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

export const SpaceFields = 'title,created_at,started_at,participant_count';
export const SpaceUserExpansions = 'host_ids,creator_id,speaker_ids,invited_user_ids';
export const UserFields = 'profile_image_url,public_metrics,description';


export const chartKey = (id) => `chart-${id}`;
export const spaceKey = (id) => `space-${id}`;