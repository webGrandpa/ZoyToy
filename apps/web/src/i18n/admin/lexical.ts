/**
 * Georgian for the rich-text editor (Lexical keeps its own strings outside Payload's packs, so without
 * these the editor showed raw keys like "lexical:general:placeholder"). Keys mirror the English ones in
 * @payloadcms/richtext-lexical (general + each feature's i18n).
 */
export const kaLexical = {
  general: {
    placeholder: 'დაიწყე წერა ან დააჭირე „/“ ბრძანებებისთვის…',
    slashMenuBasicGroupLabel: 'ძირითადი',
    slashMenuListGroupLabel: 'სიები',
    toolbarItemsActive: '{{count}} აქტიური',
  },
  link: { label: 'ბმული', loadingWithEllipsis: 'იტვირთება…' },
  blockquote: { label: 'ციტატა' },
  horizontalRule: { label: 'გამყოფი ხაზი' },
  blocks: { label: 'ბლოკები', inlineBlocks: { create: 'შექმენი: {{label}}', edit: 'რედაქტირება: {{label}}', label: 'ჩადგმული ბლოკები', remove: 'წაშლა: {{label}}' } },
  indent: { decreaseLabel: 'შეწევის შემცირება', increaseLabel: 'შეწევის გაზრდა' },
  align: { alignCenterLabel: 'ცენტრში', alignJustifyLabel: 'ორივე კიდეზე', alignLeftLabel: 'მარცხნივ', alignRightLabel: 'მარჯვნივ' },
  relationship: { label: 'კავშირი' },
  upload: { label: 'ფოტო ან ფაილი' },
  paragraph: { label: 'აბზაცი', label2: 'ჩვეულებრივი ტექსტი' },
  heading: { label: 'სათაური {{headingLevel}}' },
  orderedList: { label: 'დანომრილი სია' },
  checklist: { label: 'ჩამონათვალი' },
  unorderedList: { label: 'პუნქტებიანი სია' },
  textState: { defaultStyle: 'ჩვეულებრივი სტილი' },
}
