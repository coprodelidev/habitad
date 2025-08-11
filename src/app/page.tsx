import { Hero } from '@/components/hero';
import { generateLoremIpsum } from '@/ai/flows/generate-lorem-ipsum';

export default async function Home() {
  const { title, description } = await generateLoremIpsum({
    titleLength: 4,
    descriptionLength: 15,
  });

  return (
    <main>
      <Hero title={title} description={description} />
    </main>
  );
}
