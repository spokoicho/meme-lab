import { notice, userReady } from '../ui/shell.js';
import { isAdmin } from '../services/client.js';
import { showMemes } from '../ui/listing.js';

userReady.then(async user => {
  if (!user || !await isAdmin()) {
    notice('Тази страница е достъпна за администратори.', true);
    return;
  }
  showMemes('admin');
}).catch(error => notice(error.message, true));
