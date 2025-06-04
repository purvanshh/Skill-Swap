import Link from "next/link";

export default function Home() {
    return (
        <div>
            <h1>Home Page</h1>
            <Link href='/signup'>Go to SignUp</Link>
            <br/>
            <Link href='/signin'>Go to SignIn</Link>
            <br/>
            <Link href='/dashboard'>Go to Dashboard</Link>
        </div>
    )
}