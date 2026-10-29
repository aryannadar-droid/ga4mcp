import { notFound } from '../content';
import { Link } from '../lib/router';

export default function NotFound() {
  return (
    <main id="main" className="container-x flex min-h-[70vh] flex-col items-start justify-center pt-28">
      <h1 className="text-4xl font-bold sm:text-5xl">{notFound.title}</h1>
      <p className="mt-4 text-lg text-muted">{notFound.sub}</p>
      <Link href="/" className="btn btn-primary mt-8">
        {notFound.cta}
      </Link>
    </main>
  );
}
