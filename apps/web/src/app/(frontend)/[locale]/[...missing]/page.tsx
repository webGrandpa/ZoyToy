import { notFound } from 'next/navigation'

/**
 * Any unknown address inside a language (e.g. /ka/typo) lands here, so visitors get Zoy's own
 * 404 page — with the header, footer and balloon game — instead of the framework's bare one.
 * The page streams behind the locale loading boundary, so Next answers 200 + `noindex`
 * (its documented behaviour for streamed not-found pages) and the layout hydrates normally.
 */
export default function Missing(): never {
  notFound()
}
