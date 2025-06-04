# coreference_model.py
import re
import os
from typing import List, Tuple, Dict, Any

class AssamesesCoreferenceResolver:
    def __init__(self):
        # Pronouns with types
        self.expanded_pronouns = {
            "singular": ["মই", "তেওঁ", "সি", "তিনিও", "তাই", "তেওঁক", "তেওঁৰ", "তেওঁলৈ", "তেওঁত", "আপুনি", "আপোনাৰ", "আপুনিও"],
            "plural": ["তেওঁলোক", "তেওঁসকল", "সিহঁত", "তেওঁলোকে", "তিনিওঁ", "আমি", "আমাক", "আমাৰ", "আপোনালোকে"]
        }
        self.all_pronouns = sum(self.expanded_pronouns.values(), [])

        # Honorifics
        self.expanded_honorifics = ["ড০", "শ্ৰী", "শ্ৰীমতী", "মিঃ", "চাৰ", "মিছ", "শ্ৰীমান", "মহাশয়"]

        # Fallback lists
        self.fallback_names = ["ৰবি", "পিয়ুষ", "ৰিজু", "ত্ৰিনয়ন", "প্ৰতিশা", "ৰোহিত", "হৃষীকেশ", "বিজয়", "সঞ্জয়", "সুবর্ণা", "সুব্রত", "সৌম্য", "প্ৰিয়া", "সৌমিতা", "পাৰ্থ", "প্ৰণৱ"]
        self.fallback_locations = ["গুৱাহাটী", "গাঁও", "অসম", "শিলচৰ", "নগাঁও", "ডিব্ৰুগড়", "জোৰহাট", "কোকৰাঝাড়", "বোকাখাট", "বঙাইগাঁও", "কামৰূপ", "কাছাৰ"]
        self.fallback_organizations = ["গুৱাহাটী বিশ্ববিদ্যালয়", "অসম চৰকাৰ", "অসম বিশ্ববিদ্যালয়", "আই আই টি গুৱাহাটী", "ডিব্ৰুগড় বিশ্ববিদ্যালয়", "শিলচৰ কলেজ", "কোকৰাঝাড় বিশ্ববিদ্যালয়", "পুথিভঁৰাল", "অসম সাহিত্য সভা", "অসমীয়া সাহিত্য সংসদ", "অসমীয়া সাহিত্য পরিষদ", "অসমীয়া সাহিত্য সোসাইটি"]

        # Gender mappings
        self.name_gender_map = {
            "ৰবি": "male", "পিয়ুষ": "male", "প্ৰিয়া": "female", "সুবৰ্ণা": "female", "সৌমিতা": "female", "প্ৰতিশা": "female"
        }
        self.pronoun_gender_map = {
            "তাই": "female", "তেওঁ": "unknown", "সি": "male", "তিনিও": "unknown", "তেওঁক": "unknown", "তেওঁৰ": "unknown"
        }

        # Load external lists if available
        self.assamese_names = self._load_list_from_file('names.txt', self.fallback_names)
        self.assamese_locations = self._load_list_from_file('locations.txt', self.fallback_locations)
        self.assamese_organizations = self._load_list_from_file('organizations.txt', self.fallback_organizations)

    def _load_list_from_file(self, filename: str, fallback_list: List[str]) -> List[str]:
        """Load word list from file with fallback"""
        if os.path.exists(filename):
            try:
                with open(filename, encoding='utf-8') as f:
                    loaded = [line.strip() for line in f if line.strip()]
                if loaded:
                    return loaded
            except Exception as e:
                print(f"Warning: Could not load {filename}: {e}")
        return fallback_list

    def split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        return re.split(r'(?<=[।!?])\s*', text.strip())

    def extract_named_entities(self, sentence: str) -> List[Tuple[str, int, str]]:
        """Extract named entities from a sentence"""
        entities = []
        words = sentence.split()
        i = 0
        
        while i < len(words):
            word = words[i]
            matched = False
            
            # Multi-word organization detection
            for org in self.assamese_organizations:
                org_parts = org.split()
                if words[i:i + len(org_parts)] == org_parts:
                    entities.append((org, i, "ORG"))
                    i += len(org_parts)
                    matched = True
                    break
            
            if matched:
                continue
            
            # Single word entity detection
            if any(word.startswith(h) for h in self.expanded_honorifics):
                entities.append((word, i, "HON"))
            elif word in self.assamese_names:
                entities.append((word, i, "PER"))
            elif word in self.assamese_locations:
                entities.append((word, i, "LOC"))
            elif word.endswith("সকল") or word.endswith("লোক"):
                entities.append((word, i, "GROUP_PER"))
            
            i += 1
        
        return entities

    def extract_pronouns(self, sentence: str) -> List[Tuple[str, int, str]]:
        """Extract pronouns from a sentence"""
        words = sentence.split()
        pronouns = []
        
        for i, word in enumerate(words):
            for typ, pron_list in self.expanded_pronouns.items():
                if word in pron_list:
                    pronouns.append((word, i, typ))
        
        return pronouns

    def is_plural_person_entity(self, entity_word: str, entity_type: str) -> bool:
        """Check if entity represents a group/plural person"""
        if entity_type == "GROUP_PER":
            return True
        # Add more heuristics here for group detection
        return False

    def resolve_coreference(self, text: str) -> List[List[Tuple[str, int, str]]]:
        """Main coreference resolution function"""
        sentences = self.split_sentences(text)
        entity_positions = []
        word_index = 0
        clusters = []
        entity_to_cluster = {}

        # Collect all entities with their absolute positions
        for sent in sentences:
            entities = self.extract_named_entities(sent)
            for ent, pos, typ in entities:
                abs_pos = word_index + pos
                entity = (ent, abs_pos, typ)
                entity_positions.append(entity)
            word_index += len(sent.split())

        # Process pronouns and link to entities
        word_index = 0
        for sent in sentences:
            pronouns = self.extract_pronouns(sent)
            for pronoun, pos, pron_type in pronouns:
                abs_pos = word_index + pos
                
                # Find compatible previous entities
                prev_entities = []
                if pron_type == "singular":
                    prev_entities = [e for e in entity_positions if e[1] < abs_pos and e[2] in ("PER", "HON")]
                elif pron_type == "plural":
                    prev_entities = [e for e in entity_positions if e[1] < abs_pos and self.is_plural_person_entity(e[0], e[2])]
                
                if not prev_entities:
                    continue

                # Apply gender constraints and link to nearest compatible entity
                pron_gender = self.pronoun_gender_map.get(pronoun, "unknown")
                for ent in reversed(prev_entities):
                    ent_word, ent_pos, ent_type = ent
                    ent_gender = self.name_gender_map.get(ent_word, "unknown")
                    
                    # Skip if gender mismatch
                    if pron_gender != "unknown" and ent_gender != "unknown" and pron_gender != ent_gender:
                        continue

                    # Create or add to cluster
                    if ent in entity_to_cluster:
                        entity_to_cluster[ent].append((pronoun, abs_pos, pron_type))
                    else:
                        cluster = [ent, (pronoun, abs_pos, pron_type)]
                        clusters.append(cluster)
                        entity_to_cluster[ent] = cluster
                    break
            
            word_index += len(sent.split())

        return clusters

    def format_clusters(self, clusters: List[List[Tuple[str, int, str]]], text: str) -> Dict[str, Any]:
        """Format clusters for API response"""
        formatted_clusters = []
        
        for i, cluster in enumerate(clusters):
            cluster_data = {
                "cluster_id": i + 1,
                "mentions": []
            }
            
            for word, position, mention_type in cluster:
                cluster_data["mentions"].append({
                    "text": word,
                    "position": position,
                    "type": mention_type
                })
            
            formatted_clusters.append(cluster_data)
        
        return {
            "text": text,
            "coreference_clusters": formatted_clusters,
            "total_clusters": len(formatted_clusters)
        }

    def analyze(self, text: str) -> Dict[str, Any]:
        """Complete coreference analysis pipeline"""
        clusters = self.resolve_coreference(text)
        return self.format_clusters(clusters, text)

# Convenience function for backward compatibility
def rule_based_coref(text: str) -> List[List[Tuple[str, int, str]]]:
    """Backward compatible function"""
    resolver = AssamesesCoreferenceResolver()
    return resolver.resolve_coreference(text)
