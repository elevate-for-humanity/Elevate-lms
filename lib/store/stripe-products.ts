import { getStripe } from '@/lib/stripe/client';
import { gh, parseRepo } from "../github";

export async function createProduct(title: string, price: number) {
  const stripe = getStripe();
  const product = await stripe.products.create({ name: title });

  const priceObj = await stripe.prices.create({
    product: product.id,
    unit_amount: price * 100,
    currency: "usd",
  });

  return { product, price: priceObj };
}

export async function createStoreProduct(
  title: string,
  price: number,
  repo: string,
  description?: string
) {
  const stripe = getStripe();
  const product = await stripe.products.create({
    name: title,
    description,
    metadata: { repo },
  });

  const priceObj = await stripe.prices.create({
    product: product.id,
    unit_amount: price * 100,
    currency: "usd",
  });

  return { product, price: priceObj };
}

export async function cloneRepository(sourceRepo: string, newRepoName: string) {
  const client = gh();
  const { owner, name } = parseRepo(sourceRepo);

  // Create new repo for customer
  const newRepo = await client.repos.createForAuthenticatedUser({
    name: newRepoName,
    private: true,
    description: `Cloned from ${sourceRepo}`,
  });

  // Try to use template cloning API
  try {
    await client.repos.createUsingTemplate({
      template_owner: owner,
      template_repo: name,
      owner: newRepo.data.owner!.login,
      name: newRepoName,
      include_all_branches: true,
    });
  } catch (error) { /* Error handled silently */ 
    // If template method fails, the empty repo is still created
  }

  return newRepo.data.full_name;
}
