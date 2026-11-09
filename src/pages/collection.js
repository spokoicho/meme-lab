import { notice, userReady } from '../ui/shell.js';
import { showMemes } from '../ui/listing.js';

userReady.then(user => {
  if (!user) {
    notice('Влез в профила си, за да видиш запазените си мемета.');
    return;
  }
  showMemes('collection', user.id);
}).catch(error => notice(error.message, true));
