import { notice } from '../ui/shell.js';
import { supabase } from '../services/client.js';
import { demoGallery, showGalleryTemplates, showMemes } from '../ui/listing.js';

if (supabase) {
  showGalleryTemplates();
  showMemes('gallery');
} else {
  notice('Показани са примерни мемета. Публикациите на потребители изискват свързване със Supabase.');
  demoGallery().catch(error => notice(error.message, true));
}
