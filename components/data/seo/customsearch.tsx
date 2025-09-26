import { useState } from 'react';
import SmartInputBox from '@/components/custom-ui/input-box';
import { Button } from '@/components/custom-ui/button2';
import { fetchGoogleSearchApi } from '@/lib/data/customsearch';


export default function CustomSearch() {
    const [query, setQuery] = useState('');
    const [numResults, setNumResults] = useState('20');
    const [isFetching, setIsFetching] = useState(false);
    const [result, setResult] = useState<any>(null);

    const isFetchEnabled = query.trim().length > 0 && numResults.trim().length > 0;

    const handleFetch = async () => {
        setIsFetching(true);
        setResult(null);
        try {
            const apiResult = await fetchGoogleSearchApi({ query, num_results: Number(numResults) });
            setResult(apiResult);
        } catch (err) {
            setResult({ error: String(err) });
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className=" flex flex-col">
            {/* Query and Number input on same line */}
            <div className='border-b border-themeBase-l2 p-x20'>
                <div className="flex items-center gap-2 mb-4 text-14">
                    <SmartInputBox
                        value={query}
                        onChange={val => setQuery(val.trim().length > 0 ? val : '')}
                        placeholder="Enter search query"
                        className="w-[400px] max-w-[400px] min-w-[250px]"
                        label='Search Query'
                    />
                    <div className="flex flex-col" style={{ minWidth: '100px' }}>
                        <label htmlFor="numResults" className="text-12 text-ltxt mb-x2">Number of Results</label>
                        <input
                            id="numResults"
                            type="number"
                            min={1}
                            max={100}
                            value={numResults}
                            onChange={e => {
                                let val = Number(e.target.value);
                                if (val > 100) val = 100;
                                setNumResults(val ? String(val) : '');
                            }}
                            // placeholder="#"
                            className="border rounded-md px-2 py-2  no-spinner w-[50px]" />
                    </div>
                    <style jsx>{`
                    input.no-spinner::-webkit-outer-spin-button,
                    input.no-spinner::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input.no-spinner[type=number] {
                        -moz-appearance: textfield;
                    }
                `}</style>
                </div>
                {/* Fetch Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleFetch}
                        disabled={!isFetchEnabled || isFetching}
                        variant="primary"
                    >
                        {isFetching ? 'Fetching...' : 'Fetch Data'}
                    </Button>
                </div>
            </div>
            <div className='p-x20'>
                {/* Output */}
                {result && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        {/* Show limit_left_today */}
                        {typeof result.limit_left_today !== 'undefined' && (
                            <div className="mb-2">
                                <strong>Limit Left Today:</strong> {result.limit_left_today}
                            </div>
                        )}
                        {/* Show results array */}
                        {Array.isArray(result.results) && result.results.length > 0 ? (
                            <div>
                                <strong>Results:</strong>
                                <ul className="mt-2">
                                    {result.results.map((item: any, idx: number) => {
                                        // Support both og_* and broken_* keys
                                        const title = item.og_title || item.broken_title || '';
                                        const url = item.og_url || item.broken_url || '';
                                        const description = item.og_description || item.broken_description || '';
                                        return (
                                            <li key={idx} className="mb-4 border-b pb-2">
                                                <div><strong>Title:</strong> {title}</div>
                                                <div><strong>URL:</strong> {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{url}</a> : 'N/A'}</div>
                                                <div><strong>Description:</strong> {description || 'N/A'}</div>
                                                <div><strong>H1 Tags:</strong> {Array.isArray(item.h1_tags) && item.h1_tags.length > 0 ? item.h1_tags.join(', ') : 'None'}</div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ) : (
                            <div>No results found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
