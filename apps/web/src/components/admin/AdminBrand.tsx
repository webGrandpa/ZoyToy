import { GiraffeHead } from '@zoytoy/ui/Giraffe'

/** Logo on the admin login screen. */
export function AdminLogo() {
  return (
    <div className="zt-admin-logo">
      <GiraffeHead width={84} height={84} />
      <div>
        <b>Zoy Toy</b>
        <span>ზოი თოი · მართვის პანელი</span>
      </div>
    </div>
  )
}

/** Small mark in the admin navigation. */
export function AdminIcon() {
  return <GiraffeHead width={30} height={30} />
}
