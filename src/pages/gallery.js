import { notice } from '../ui/shell.js';
import { supabase } from '../services/client.js';
import { demoGallery, showMemes } from '../ui/listing.js';

if (supabase) showMemes('gallery');
else {
  notice('Показани са примерни мемета. Публикациите на потребители изискват свързване със Supabase.');
  demoGallery().catch(error => notice(error.message, true));
}
