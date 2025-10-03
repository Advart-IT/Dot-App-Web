import React, { useState } from 'react';
import { Button } from '@/components/custom-ui/button2';
import CustomSearch from './customsearch';
import SearchConsole from './searchconsole';
import IndexedPages from './indexed_pages';


const SECTION_OPTIONS = ['Search Console', 'Indexed Pages', 'Custom Search'];

export default function seo({ brandName }: { brandName: string }) {
    const [selectedSection, setSelectedSection] = useState<'Search Console' | 'Indexed Pages' | 'Custom Search'>('Search Console');

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <h2 className="text-16 font-semibold mb-2">SEO</h2>
            <div className="bg-white rounded-xl shadow flex flex-col flex-1 min-h-0 h-full">
                <div className="flex flex-col">
                    <div className="flex gap-2 p-x20">
                        {SECTION_OPTIONS.map(section => (
                            <Button
                                key={section}
                                onClick={() => setSelectedSection(section as any)}
                                variant='outline'
                                size='m'
                                className={`${selectedSection === section ? '!bg-newsecondary !text-themeBase' : ''}`}
                            >
                                {section}
                            </Button>
                        ))}
                    </div>
                    <div>
                        <div style={{ display: selectedSection === 'Search Console' ? 'block' : 'none' }}>
                            <SearchConsole brandName={brandName} />
                        </div>
                        <div style={{ display: selectedSection === 'Indexed Pages' ? 'block' : 'none' }}>
                            <IndexedPages brandName={brandName} />
                        </div>
                        <div style={{ display: selectedSection === 'Custom Search' ? 'block' : 'none' }}>
                            <CustomSearch />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}