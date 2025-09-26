import React, { useState } from 'react';

import { Button } from '@/components/custom-ui/button2';
import OverallSection from './overall';
import CollectionPageSection from './collections';
import CustomPageSection from './custom';


const SECTION_OPTIONS = ['Overall', 'Collection Page', 'Custom'];

export default function GA4Summary({ brandName }: { brandName: string }) {
    const [selectedSection, setSelectedSection] = useState<'Overall' | 'Collection Page' | 'Custom'>('Overall');

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <h2 className="text-16 font-semibold mb-2">Google Analytics Summary</h2>
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
                        <div style={{ display: selectedSection === 'Overall' ? 'block' : 'none' }}>
                            <OverallSection brandName={brandName} />
                        </div>
                        <div style={{ display: selectedSection === 'Collection Page' ? 'block' : 'none' }}>
                            <CollectionPageSection brandName={brandName} />
                        </div>
                        <div style={{ display: selectedSection === 'Custom' ? 'block' : 'none' }}>
                            <CustomPageSection brandName={brandName} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}