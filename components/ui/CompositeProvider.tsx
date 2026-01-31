import React, { ReactNode } from 'react';

interface CompositeProviderProps {
    providers: React.ComponentType<{ children: ReactNode }>[];
    children: ReactNode;
}

/**
 * CompositeProvider allows for flattening deeply nested Context Providers.
 * 
 * Usage:
 * <CompositeProvider providers={[Provider1, Provider2, [Provider3, { props }]]}>
 *   <App />
 * </CompositeProvider>
 */
const CompositeProvider: React.FC<CompositeProviderProps> = ({ providers, children }) => {
    return (
        <>
            {providers.reduceRight((acc, Provider) => {
                return <Provider>{acc}</Provider>;
            }, children)}
        </>
    );
};

export default CompositeProvider;
