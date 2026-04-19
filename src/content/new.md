## Introduction

> *sā vidyā naus tīrṣuṇāṃ gambhīraṃ kāvyasāgaram* — Daṇḍin

A sizeable part of Sanskrit literature — and probably the majority of works most learners will ever read — is written in verse. Basic knowledge of Sanskrit metres is directly related to the enjoyment and appreciation of that literature, and it is essential for criticism and literary study.

This site collects resources related to Sanskrit metres: metre identification, scansion tools, examples, and a starter guide for writing metrical Sanskrit.

> **Note:** The following introduction focuses on **varṇavṛtta** (metres regulated by syllable count and quantity). Mātrāvṛtta (moraic metres) and Vedic metres are separate traditions and are not covered here. When *metre* is used here, understand it to mean varṇavṛtta only; otherwise much of what is said would be inaccurate.

---

## Syllables and Syllabification

In Sanskrit, vowels can be long (ā ī ū ṝ e ai o au) or short (a i u ṛ ḷ). Diphthongs (ai, e, o, au) are always long. Syllables are either heavy (*guru*) or light (*laghu*). A practical rule is:

> A syllable is light if it has a short vowel and is open. All other syllables are heavy.

More precisely:

1. Syllables with only short vowels are light (e.g., *ka, ku, ki*). Syllables with long vowels are heavy (e.g., *kā, kī, kū, kai*).
2. A syllable with a short vowel that is **closed** is heavy. For example, *kathā* → `ka.thā` (*ka* is open, so light); *karma* → `kar.ma` (*kar* is closed, so heavy). Syllables ending in visarga (ḥ) or anusvāra (ṃ) are heavy.
3. In consonant clusters, all consonants except the last belong to the previous syllable. Example: *dharma* → `dhar.ma`. For a larger cluster: *kārtsnya* → `kārtsn.ya` (the last consonant *y* starts the next syllable). Ligatures such as *kṣa* and *jña* follow the same rule: *kṣa* → `k.ṣa`, *jña* → `j.ña`.
4. Word boundaries do not matter. So *asti kṣetre* would be scanned as `as.tik.ṣet.re`. However, this only applies to words within the same line.

---

## Trying to Separate Syllables

This is the first verse of the **Bhagavadgītā**:

```
dharmakṣetre kuru-kṣetre samavetā yuyutsavaḥ
māmakāḥ pāṇḍavāś caiva kim akurvata saṃjaya
```

Syllabification (L = Laghu, G = Guru):

```
dhar(G).mak(G).ṣet(G).re(G).ku(L).ruk(G).ṣe(G).tre(G)
sa(L).ma(L).ve(L).tā(G).yu(L).yut(G).sa(L).vaḥ(G)
mā(G).ma(L).kāḥ(G).pāṇ(G).ḍa(L).vāś(G).cai(G).va(L)
ki(L).ma(L).kur(G).va(L).ta(L).saṃ(G).ja(L).ya(L)
```

The following is an example of such syllabification from our program (first verse of Kālidāsa's *Meghadūta*):

![Scansion Example](image.png)

---

## Symbols

Heavy and light syllables can be marked in several ways. Traditional notations include:

**Indigenous:**

| Symbol | Meaning |
|--------|---------|
| । | Light (laghu) |
| ऽ | Heavy (guru) |

**Western:**

| Symbol | Meaning |
|--------|---------|
| ⏑ | Light |
| — | Heavy |
| x | Anceps (either) |

---

## Metres

Now that we know about syllables and their weights, we are ready to understand metres. Metres are simply combinations of laghu and guru syllables.

Sanskrit metres are usually arranged in sets of four to form a stanza. In some metres all four units (called *pāda* = quarter) follow the same pattern, while in others the patterns differ.

### Caesura

Beyond the arrangement of laghu and guru syllables, there is also the role of caesura. Caesura (Sanskrit: *yati*) means pause. When you reach the point of caesura, you must stop recitation for a brief moment — noticeable, but shorter than the pause between lines. Caesura is marked here with |. Some metres may have one or more caesurae within a single line, while others have none. Even in metres without in-line caesura, the reciter must pause at line breaks.

### Samavṛtta

If all four *pāda*s of a stanza follow the same pattern of laghu and guru syllables, the metre is called *samavṛtta*. This is the largest category of metres and the type most commonly encountered.

As an example, consider a metre with sixteen syllables per line where each laghu syllable is followed by a guru syllable. In metrical notation:

```
। ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ
। ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ
। ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ
। ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ । ऽ
```

Any poet composing in this metre **must** be bound by these constraints. If two laghu syllables appear in succession anywhere in the metre above, the metre breaks.This is called *chandobhaṅga*. An experienced reader will immediately sense that something is wrong, even without manually scanning the verse. Such metrical errors are studiously avoided by good poets. There is even a saying to the effect:

> api māṣaṃ maṣaṃ kuryāt chandobhaṅgaṃ na kārayet।

> May be even write maṣa instead of māṣa but let him not commit a metrical error. 

The pattern shown above is called *pañcacāmara* and is not rare in Sanskrit literature. The following is the first stanza of a popular prayer composed in this metre:

```
jaṭāṭavīgalajjalapravāhapāvitasthale
gale'valambya lambitāṃ bhujaṃgatuṃgamālikām
ḍamaḍḍamaḍḍamaḍḍamanninādavaḍḍamarvayaṃ
cakāra caṃḍatāṃḍavaṃ tanotu naḥ śivaḥ śivam
```

### Ardhasamavṛtta

If the first and third lines share one pattern while the second and fourth lines share another, the metre is called *ardhasamavṛtta*. The popular *śloka* metre is an example:

```
x x x x । ऽ ऽ x
x x x x । ऽ । x
x x x x । ऽ ऽ x
x x x x । ऽ । x
```

### Viṣamavṛtta

If all four lines follow different patterns, the metre is called *viṣamavṛtta*. These are rare in actual literature compared to the first two types. *Padacaturūrdhva* is an example:

```
। । ऽ ऽ । ऽ ऽ ऽ

। ऽ ऽ । । ऽ । ऽ । ऽ ऽ ऽ

। । ऽ ऽ । । ऽ ऽ ऽ ऽ ऽ ऽ । ऽ ऽ ऽ

। । । । । । । । । ऽ । । । । ऽ ऽ । ऽ ऽ ऽ
```

---

## Tone and Accent

Despite repeated assertions to the contrary in modern times, Classical Sanskrit — i.e., the language as described by the three sages (Pāṇini, Kātyāyana, and Patañjali) — does have pitch accent. Pāṇini treats it in his grammar not only for the *chāndasa* but also for the *bhāṣā*. The story of *indraśatru* is used as an example of this by Patañjali:

> *duṣṭaḥ śabdaḥ svarato varṇato vā*
> *mithyā prayukto na tam artham āha;*
> *sa vāgvajro yajamānaṃ hinasti*
> *yathendraśatruḥ svarato 'parādhāt.*

> A faulty word — whether due to accent or sounds — used wrongly does not express the intended meaning. That sound-thunderbolt smites the *yajamāna*, just as *indraśatru* does by unallowed accent.

Besides a handful of specialists, almost no one pronounces Classical Sanskrit with pitch accents today. Pronouncing all letters clearly is generally sufficient, though the stress accent usually falls on either the ultimate or penultimate syllable.

As for tone, various approaches have existed from ancient and medieval times alike. Many medieval works on poetry and rhetoric touch on this topic in general terms — for example, Rājaśekhara's *Kāvyamīmāṃsā*, Ch. 7.