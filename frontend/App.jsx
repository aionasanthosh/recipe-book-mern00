import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/recipes';
const emptyForm = { name: '', category: 'Breakfast', ingredients: '', steps: '', cookingTime: '' };
const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drinks', 'Other'];

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadRecipes() {
    try { setRecipes(await request(API)); setError(''); }
    catch (e) { setError(e.message + ' Check that the backend is running and MongoDB Atlas is configured.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadRecipes(); }, []);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function resetForm() { setForm(emptyForm); setEditing(null); }

  async function submit(e) {
    e.preventDefault(); setMessage(''); setError('');
    const payload = { ...form, cookingTime: Number(form.cookingTime) };
    try {
      const saved = await request(editing ? `${API}/${editing}` : API, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload)
      });
      setMessage(editing ? 'Recipe updated successfully!' : 'Recipe added successfully!');
      resetForm();
      await loadRecipes();
      if (selected?._id === saved._id) setSelected(saved);
    } catch (err) { setError(err.message); }
  }

  function startEdit(recipe) {
    setEditing(recipe._id);
    setForm({ name: recipe.name, category: recipe.category, ingredients: recipe.ingredients, steps: recipe.steps, cookingTime: String(recipe.cookingTime) });
    setSelected(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeRecipe(recipe) {
    if (!window.confirm(`Delete "${recipe.name}"? This cannot be undone.`)) return;
    setMessage(''); setError('');
    try {
      await request(`${API}/${recipe._id}`, { method: 'DELETE' });
      setMessage('Recipe deleted successfully!');
      if (selected?._id === recipe._id) setSelected(null);
      await loadRecipes();
    } catch (err) { setError(err.message); }
  }

  return <div className="app-shell">
    <header className="hero">
      <nav className="nav"><div className="brand"><span className="brand-icon">♨</span> Recipe<span>Book</span></div><a href="#recipes">My Recipes</a></nav>
      <div className="hero-content"><p className="eyebrow">YOUR KITCHEN, YOUR COLLECTION</p><h1>Good food starts<br />with a <em>good recipe.</em></h1><p className="hero-sub">Save your favourites. Make every meal memorable.</p><a className="primary-link" href="#add-recipe">＋ Add a recipe</a></div>
      <div className="hero-decoration">✳</div>
    </header>

    <main className="main">
      <section className="form-section" id="add-recipe">
        <div className="section-heading"><div><p className="eyebrow">FROM YOUR KITCHEN</p><h2>{editing ? 'Edit recipe' : 'Add a recipe'}</h2></div><span className="step-badge">{editing ? 'EDIT' : '01 / CREATE'}</span></div>
        <form className="recipe-form" onSubmit={submit}>
          <label>Recipe name<input name="name" value={form.name} onChange={change} placeholder="e.g. Creamy tomato pasta" maxLength="100" required /></label>
          <div className="form-row">
            <label>Category<select name="category" value={form.category} onChange={change}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Cooking time (minutes)<input name="cookingTime" type="number" min="1" max="1440" step="1" value={form.cookingTime} onChange={change} placeholder="30" required /></label>
          </div>
          <label>Ingredients<textarea name="ingredients" value={form.ingredients} onChange={change} placeholder="List ingredients, one per line..." rows="3" required /></label>
          <label>Preparation steps<textarea name="steps" value={form.steps} onChange={change} placeholder="Describe how to prepare your recipe..." rows="4" required /></label>
          <div className="form-actions"><button className="button-primary" type="submit">{editing ? 'Save changes' : 'Save recipe'} <span>↗</span></button>{editing && <button className="button-secondary" type="button" onClick={resetForm}>Cancel</button>}</div>
        </form>
      </section>

      {(message || error) && <div className={error ? 'notice error' : 'notice success'} role="status">{error || message}<button onClick={() => { setError(''); setMessage(''); }} aria-label="Dismiss">×</button></div>}

      <section className="recipes-section" id="recipes">
        <div className="section-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2>Your recipe collection <span className="count">{recipes.length}</span></h2></div><span className="step-badge">02 / DISCOVER</span></div>
        {loading ? <p className="empty-state">Loading your recipes…</p> : recipes.length === 0 ? <div className="empty-state"><div className="empty-icon">♧</div><h3>Your collection starts here</h3><p>Add your first recipe using the form above.</p></div> :
          <div className="recipe-grid">{recipes.map((recipe, i) => <article className="recipe-card" key={recipe._id}>
            <div className={`card-art art-${i % 4}`}><span className="category-pill">{recipe.category}</span><span className="food-symbol">{['✿', '◉', '❋', '✳'][i % 4]}</span></div>
            <div className="card-content"><div className="time">◷ &nbsp;{recipe.cookingTime} min</div><h3>{recipe.name}</h3><p className="ingredients-preview">{recipe.ingredients.split('\n').filter(Boolean).slice(0, 2).join(' · ')}</p>
              <div className="card-actions"><button className="text-button" onClick={() => setSelected(recipe)}>View details ↗</button><div><button className="icon-button" title="Edit recipe" onClick={() => startEdit(recipe)}>✎</button><button className="icon-button delete" title="Delete recipe" onClick={() => removeRecipe(recipe)}>⌫</button></div></div>
            </div>
          </article>)}</div>}
      </section>
    </main>

    <footer><div className="brand">♨ Recipe<span>Book</span></div><p>Made with care, served with love.</p></footer>

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">×</button><span className="category-pill">{selected.category}</span><p className="eyebrow">RECIPE DETAILS · {selected.cookingTime} MIN</p><h2 id="detail-title">{selected.name}</h2>
      <h3>Ingredients</h3><p className="detail-text">{selected.ingredients}</p><h3>Preparation steps</h3><p className="detail-text">{selected.steps}</p>
      <div className="form-actions"><button className="button-primary" onClick={() => startEdit(selected)}>Edit recipe ↗</button><button className="button-secondary" onClick={() => setSelected(null)}>Close</button></div>
    </section></div>}
  </div>;
}
