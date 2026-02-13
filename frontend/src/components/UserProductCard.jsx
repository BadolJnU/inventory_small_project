const [qty, setQty] = useState(1);

const handleReserve = async () => {
  await api.post('/reserve', {
    itemId: item.id,
    userId: currentUserId,
    quantity: qty
  });
  alert("Reserved!");
};

return (
  <div className="border p-4">
    <h3>{item.name}</h3>
    <input 
      type="number" 
      min="1" 
      max={item.availableStock} 
      value={qty} 
      onChange={(e) => setQty(e.target.value)} 
      className="border mr-2 w-16"
    />
    <button onClick={handleReserve} className="bg-green-500 text-white px-4 py-2">
      Reserve
    </button>
  </div>
);